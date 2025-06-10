"use server";

import { db } from "@/db";
import {
  chestTypes,
  chestLootTable,
  itemTypes,
  rarities,
  playerItems,
  players,
} from "@/db/schema";
import { createServerAction } from "zsa";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

type Player = typeof players.$inferSelect;

// Schema for creating a test player
const createTestPlayerSchema = z.object({
  telegramId: z.string(),
  username: z.string().optional(),
});

// Create a test player if it doesn't exist
export const $createTestPlayer = createServerAction()
  .input(createTestPlayerSchema)
  .handler(async ({ input }) => {
    try {
      // Check if player exists
      const [existingPlayer] = await db
        .select()
        .from(players)
        .where(eq(players.telegramId, input.telegramId));

      if (existingPlayer) {
        return { success: true, data: existingPlayer };
      }

      // Create new player
      const [newPlayer] = await db
        .insert(players)
        .values({
          telegramId: input.telegramId,
          username: input.username,
        })
        .returning();

      return { success: true, data: newPlayer };
    } catch (error) {
      console.error("Error creating test player:", error);
      return { success: false, error: "Failed to create test player" };
    }
  });

// Schema for getting chest contents
const getChestContentsSchema = z.object({
  chestName: z.string(),
});

type GetChestContentsResult = {
  success: boolean;
  data?: {
    chest: {
      id: string;
      name: string;
      displayName: string;
      cost: number;
      currencyType: string;
      guaranteedRarityMin: string | null;
    };
    items: Array<{
      id: string;
      name: string;
      imageUrl: string;
      rarity: {
        name: string;
        colorHex: string;
      };
      dropWeight: number;
    }>;
  };
  error?: string;
};

// Schema for opening a chest
const openChestSchema = z.object({
  playerId: z.string(),
  chestName: z.string(),
});

type OpenChestResult = {
  success: boolean;
  data?: {
    item: {
      id: string;
      name: string;
      imageUrl: string;
      rarity: {
        name: string;
        colorHex: string;
      };
    };
  };
  error?: string;
};

// Get chest contents with all possible items and their drop weights
export const $getChestContents = createServerAction()
  .input(getChestContentsSchema)
  .handler(
    async ({
      input,
    }: {
      input: z.infer<typeof getChestContentsSchema>;
    }): Promise<GetChestContentsResult> => {
      try {
        // Get chest info
        const [chest] = await db
          .select()
          .from(chestTypes)
          .where(eq(chestTypes.name, input.chestName));

        if (!chest) {
          return {
            success: false,
            error: "Chest not found",
          };
        }

        // Get all items that can drop from this chest
        const items = await db
          .select({
            id: itemTypes.id,
            name: itemTypes.name,
            imageUrl: itemTypes.imageUrl,
            rarity: {
              name: rarities.name,
              colorHex: rarities.colorHex,
            },
            dropWeight: chestLootTable.dropWeight,
            attributes: itemTypes.attributes,
          })
          .from(chestLootTable)
          .innerJoin(itemTypes, eq(chestLootTable.itemTypeId, itemTypes.id))
          .innerJoin(rarities, eq(itemTypes.rarityId, rarities.id))
          .where(eq(chestLootTable.chestTypeId, chest.id));

        // Ensure dropWeight is never null by defaulting to 1
        const itemsWithDefaultWeight = items.map((item) => ({
          ...item,
          dropWeight: item.dropWeight ?? 1,
        }));

        return {
          success: true,
          data: {
            chest: {
              id: chest.id,
              name: chest.name,
              displayName: chest.displayName,
              cost: chest.cost,
              currencyType: chest.currencyType,
              guaranteedRarityMin: chest.guaranteedRarityMin,
            },
            items: itemsWithDefaultWeight,
          },
        };
      } catch (error) {
        console.error("Error getting chest contents:", error);
        return { success: false, error: "Failed to get chest contents" };
      }
    }
  );

// Open a chest and get a random item
export async function $openChest({
  playerId,
  chestName,
}: {
  playerId: string;
  chestName: string;
}) {
  if (!playerId || !chestName) {
    console.error("Missing required parameters:", { playerId, chestName });
    return [null, { message: "Missing required parameters" }];
  }

  try {
    console.log("Opening chest:", { playerId, chestName });

    // Get chest info
    const chest = await db.query.chestTypes.findFirst({
      where: eq(chestTypes.name, chestName),
    });

    if (!chest) {
      console.log("Chest not found:", chestName);
      return [null, { message: "Chest not found" }];
    }
    console.log("Found chest:", chest);

    // Get or create test player
    let player = await db.query.players.findFirst({
      where: eq(players.telegramId, playerId),
    });

    if (!player) {
      console.log("Creating new player:", playerId);
      try {
        const [newPlayer] = await db
          .insert(players)
          .values({
            telegramId: playerId,
            username: "Test Player",
          })
          .returning();
        player = newPlayer;
      } catch (error) {
        console.error("Error creating player:", error);
        return [null, { message: "Failed to create player" }];
      }
    }
    console.log("Using player:", player);

    // Get available loot for this chest
    const availableLoot = await db.query.chestLootTable.findMany({
      where: eq(chestLootTable.chestTypeId, chest.id),
      with: {
        itemType: {
          with: {
            rarity: true,
          },
        },
      },
    });

    console.log("Available loot count:", availableLoot.length);

    if (!availableLoot.length) {
      console.log("No items available in chest:", chestName);
      return [null, { message: "No items available in this chest" }];
    }

    // Select random item based on weights
    const selectedItem = selectRandomItemByWeight(availableLoot);
    if (!selectedItem) {
      console.error("Failed to select random item");
      return [null, { message: "Failed to select random item" }];
    }
    console.log("Selected item:", selectedItem);

    // Format the item for the response
    const formattedItem = {
      id: selectedItem.itemType.id,
      name: selectedItem.itemType.name,
      imageUrl: selectedItem.itemType.imageUrl,
      rarity: {
        name: selectedItem.itemType.rarity.name,
        colorHex: selectedItem.itemType.rarity.colorHex,
      },
    };

    // Give the item to the player
    try {
      await db.insert(playerItems).values({
        playerId: player.id,
        itemTypeId: selectedItem.itemType.id,
        isEquipped: false,
      });
    } catch (error) {
      console.error("Error giving item to player:", error);
      return [null, { message: "Failed to give item to player" }];
    }

    return [
      {
        success: true,
        data: {
          item: formattedItem,
        },
      },
      null,
    ];
  } catch (error) {
    console.error("Error opening chest:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return [null, { message: "Failed to open chest" }];
  }
}

function selectRandomItemByWeight(lootTable: any[]) {
  // Calculate total weight
  const totalWeight = lootTable.reduce((sum, item) => sum + item.dropWeight, 0);
  let random = Math.random() * totalWeight;

  // Select item based on weight
  for (const item of lootTable) {
    random -= item.dropWeight;
    if (random <= 0) return item;
  }

  return lootTable[0]; // fallback
}

// Get all chest types
export const $getAllChests = createServerAction().handler(async () => {
  try {
    const chests = await db.select().from(chestTypes).orderBy(chestTypes.cost);

    return { success: true, data: chests };
  } catch (error) {
    console.error("Error getting chests:", error);
    return { success: false, error: "Failed to get chests" };
  }
});

// Get user by address
export async function $getUserByAddress({
  address,
}: {
  address: string;
}): Promise<
  [
    { success: boolean; data: Player | null; error?: string } | null,
    { message: string } | null
  ]
> {
  try {
    const user = await db.query.players.findFirst({
      where: eq(players.telegramId, address),
    });
    return [{ success: true, data: user || null }, null];
  } catch (error) {
    console.error("Error fetching user:", error);
    return [null, { message: "Failed to fetch user data" }];
  }
}
