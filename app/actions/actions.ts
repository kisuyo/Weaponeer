"use server";

import { db } from "@/db";
import { players, chestOpeningLogs } from "@/db/schema";
import { createServerAction } from "zsa";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { ChestTypes, getChestById } from "@/config/chests";
import { SwordTypes, getSwordById } from "@/config/swords";
import { logChestOpening } from "@/db/schema";

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
        // Get chest info from config
        const chest = ChestTypes.find(
          (chest) => chest.name === input.chestName
        );

        if (!chest) {
          return {
            success: false,
            error: "Chest not found",
          };
        }

        // Get all swords that can drop from this chest based on drop weights
        const items = SwordTypes.filter((sword) => {
          const rarityWeight = chest.dropWeights[sword.rarity];
          return rarityWeight && rarityWeight > 0;
        }).map((sword) => ({
          id: sword.id,
          name: sword.name,
          imageUrl: sword.imageUrl,
          rarity: {
            name: sword.rarity,
            colorHex: getRarityColorHex(sword.rarity),
          },
          dropWeight: chest.dropWeights[sword.rarity] || 0,
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
              guaranteedRarityMin: chest.guaranteedRarityMin || null,
            },
            items,
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

    // Get chest info from config
    const chest = ChestTypes.find((chest) => chest.name === chestName);

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

    // Get available swords based on chest drop weights
    const availableSwords = SwordTypes.filter((sword) => {
      const rarityWeight = chest.dropWeights[sword.rarity];
      return rarityWeight && rarityWeight > 0;
    });

    console.log("Available swords count:", availableSwords.length);

    if (!availableSwords.length) {
      console.log("No items available in chest:", chestName);
      return [null, { message: "No items available in this chest" }];
    }

    // Select random sword based on weights
    const selectedSword = selectRandomSwordByWeight(
      availableSwords,
      chest.dropWeights
    );
    if (!selectedSword) {
      console.error("Failed to select random sword");
      return [null, { message: "Failed to select random item" }];
    }
    console.log("Selected sword:", selectedSword);

    // Format the sword for the response
    const formattedItem = {
      id: selectedSword.id,
      name: selectedSword.name,
      imageUrl: selectedSword.imageUrl,
      rarity: {
        name: selectedSword.rarity,
        colorHex: getRarityColorHex(selectedSword.rarity),
      },
    };

    // Log the chest opening
    await logChestOpening(
      db,
      player.id,
      chest.id,
      selectedSword.id,
      selectedSword.rarity,
      chest.cost,
      chest.currencyType
    );

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

function selectRandomSwordByWeight(
  swords: any[],
  dropWeights: Record<string, number>
) {
  // Calculate total weight
  const totalWeight = swords.reduce(
    (sum, sword) => sum + (dropWeights[sword.rarity] || 0),
    0
  );
  let random = Math.random() * totalWeight;

  // Select sword based on weight
  for (const sword of swords) {
    const weight = dropWeights[sword.rarity] || 0;
    random -= weight;
    if (random <= 0) return sword;
  }

  return swords[0]; // fallback
}

function getRarityColorHex(rarity: string): string {
  const rarityColors: Record<string, string> = {
    common: "#808080", // Gray
    uncommon: "#00FF00", // Green
    rare: "#0000FF", // Blue
    epic: "#800080", // Purple
    legendary: "#FFD700", // Gold
    mythic: "#FF0000", // Red
  };
  return rarityColors[rarity] || "#808080";
}

// Get all chest types
export const $getAllChests = createServerAction().handler(async () => {
  try {
    return { success: true, data: ChestTypes };
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
