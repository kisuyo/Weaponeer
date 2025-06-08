import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Define item rarities and their drop weights
export const rarities = pgTable("rarities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'common', 'rare', 'epic', 'legendary', 'mythic'
  dropWeight: integer("drop_weight").notNull(), // 70, 20, 8, 1.8, 0.2 (percentages)
  colorHex: text("color_hex").notNull(), // '#gray', '#blue', '#purple', '#orange', '#gold'
  createdAt: timestamp("created_at").defaultNow(),
});

// Item templates - these are the "blueprint" items you create
export const itemTypes = pgTable("item_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  rarityId: uuid("rarity_id")
    .references(() => rarities.id)
    .notNull(),
  slot: text("slot").notNull(), // 'weapon', 'helmet', 'shield', 'cape'
  attributes: jsonb("attributes"), // { "coins_per_tap": 0.5, "offline_storage": 100, "auto_tap": true }
  isActive: boolean("is_active").default(true), // Can disable items without deleting
  createdAt: timestamp("created_at").defaultNow(),
});

// Players
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  coins: decimal("coins", { precision: 20, scale: 2 }).default("0"),
  totalTaps: integer("total_taps").default(0),
  offlineCoins: decimal("offline_coins", { precision: 20, scale: 2 }).default(
    "0"
  ),
  offlineLimit: integer("offline_limit").default(100), // Can be upgraded
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player's actual item instances - when they get a sword, it goes here
export const playerItems = pgTable("player_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  itemTypeId: uuid("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  isEquipped: boolean("is_equipped").default(false),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

// Define chest types and their properties
export const chestTypes = pgTable("chest_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // 'basic', 'premium', 'crypto', 'starter'
  displayName: text("display_name").notNull(), // 'Basic Chest', 'Premium Chest'
  cost: integer("cost").notNull(),
  currencyType: text("currency_type").notNull(), // 'coins', 'crypto'
  guaranteedRarityMin: text("guaranteed_rarity_min"), // 'rare' means at least rare guaranteed
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table - which items can drop from which chests
export const chestLootTable = pgTable(
  "chest_loot_table",
  {
    id: uuid("id").defaultRandom(),
    chestTypeId: uuid("chest_type_id")
      .references(() => chestTypes.id)
      .notNull(),
    itemTypeId: uuid("item_type_id")
      .references(() => itemTypes.id)
      .notNull(),
    dropWeight: integer("drop_weight").default(1), // Custom weight for this chest-item combo
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Prevent duplicate entries
    chestItemUnique: primaryKey(table.chestTypeId, table.itemTypeId),
  })
);

// Track chest openings for analytics
export const chestOpenings = pgTable("chest_openings", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  chestTypeId: uuid("chest_type_id")
    .references(() => chestTypes.id)
    .notNull(),
  costPaid: integer("cost_paid").notNull(),
  currencyType: text("currency_type").notNull(),
  itemsReceived: jsonb("items_received"), // Array of item_type_ids received
  openedAt: timestamp("opened_at").defaultNow(),
});

// Relations for easier querying
export const chestTypesRelations = relations(chestTypes, ({ many }) => ({
  lootTable: many(chestLootTable),
  openings: many(chestOpenings),
}));

export const chestLootTableRelations = relations(chestLootTable, ({ one }) => ({
  chestType: one(chestTypes, {
    fields: [chestLootTable.chestTypeId],
    references: [chestTypes.id],
  }),
  itemType: one(itemTypes, {
    fields: [chestLootTable.itemTypeId],
    references: [itemTypes.id],
  }),
}));

export const playersRelations = relations(players, ({ many }) => ({
  items: many(playerItems),
  chestOpenings: many(chestOpenings),
}));

export const itemTypesRelations = relations(itemTypes, ({ one, many }) => ({
  rarity: one(rarities, {
    fields: [itemTypes.rarityId],
    references: [rarities.id],
  }),
  playerItems: many(playerItems),
}));

export const playerItemsRelations = relations(playerItems, ({ one }) => ({
  player: one(players, {
    fields: [playerItems.playerId],
    references: [players.id],
  }),
  itemType: one(itemTypes, {
    fields: [playerItems.itemTypeId],
    references: [itemTypes.id],
  }),
}));

export const raritiesRelations = relations(rarities, ({ many }) => ({
  itemTypes: many(itemTypes),
}));

// Zod schemas for each table
export const raritySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  dropWeight: z.number().int(),
  colorHex: z.string(),
  createdAt: z.date(),
});

export const itemTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  imageUrl: z.string().url(),
  rarityId: z.string().uuid(),
  slot: z.string(),
  attributes: z.record(z.any()).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const playerSchema = z.object({
  id: z.string().uuid(),
  telegramId: z.string(),
  username: z.string().optional(),
  coins: z.number(),
  totalTaps: z.number().int(),
  offlineCoins: z.number(),
  offlineLimit: z.number().int(),
  lastActive: z.date(),
  createdAt: z.date(),
});

export const playerItemSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  itemTypeId: z.string().uuid(),
  isEquipped: z.boolean(),
  acquiredAt: z.date(),
});

export const chestTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  cost: z.number().int(),
  currencyType: z.string(),
  guaranteedRarityMin: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const chestLootTableSchema = z.object({
  id: z.string().uuid(),
  chestTypeId: z.string().uuid(),
  itemTypeId: z.string().uuid(),
  dropWeight: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const chestOpeningSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  chestTypeId: z.string().uuid(),
  costPaid: z.number().int(),
  currencyType: z.string(),
  itemsReceived: z.array(z.string().uuid()).optional(),
  openedAt: z.date(),
});

// Create insert and select schemas using drizzle-zod
export const insertRaritySchema = createInsertSchema(rarities);
export const selectRaritySchema = createSelectSchema(rarities);

export const insertItemTypeSchema = createInsertSchema(itemTypes);
export const selectItemTypeSchema = createSelectSchema(itemTypes);

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);

export const insertPlayerItemSchema = createInsertSchema(playerItems);
export const selectPlayerItemSchema = createSelectSchema(playerItems);

export const insertChestTypeSchema = createInsertSchema(chestTypes);
export const selectChestTypeSchema = createSelectSchema(chestTypes);

export const insertChestLootTableSchema = createInsertSchema(chestLootTable);
export const selectChestLootTableSchema = createSelectSchema(chestLootTable);

export const insertChestOpeningSchema = createInsertSchema(chestOpenings);
export const selectChestOpeningSchema = createSelectSchema(chestOpenings);

// Example usage functions:

// 1. Setup chest types
export async function setupChestTypes(db: any) {
  return await db.insert(chestTypes).values([
    {
      name: "basic",
      displayName: "Basic Chest",
      cost: 100,
      currencyType: "coins",
    },
    {
      name: "premium",
      displayName: "Premium Chest",
      cost: 1000,
      currencyType: "coins",
      guaranteedRarityMin: "rare",
    },
    {
      name: "crypto",
      displayName: "Crypto Chest",
      cost: 10,
      currencyType: "crypto",
      guaranteedRarityMin: "epic",
    },
  ]);
}

// 2. Add sword to specific chests
export async function addSwordToChests(
  db: any,
  itemTypeId: string,
  chestNames: string[],
  customWeight?: number
) {
  const chests = await db.query.chestTypes.findMany({
    where: inArray(chestTypes.name, chestNames),
  });

  const lootEntries = chests.map((chest: { id: string }) => ({
    chestTypeId: chest.id,
    itemTypeId: itemTypeId,
    dropWeight: customWeight || 1,
  }));

  return await db.insert(chestLootTable).values(lootEntries);
}

// 3. Get available loot for a chest
export async function getChestLoot(db: any, chestName: string) {
  return await db.query.chestLootTable.findMany({
    where: eq(
      chestLootTable.chestTypeId,
      db
        .select({ id: chestTypes.id })
        .from(chestTypes)
        .where(eq(chestTypes.name, chestName))
    ),
    with: {
      itemType: {
        with: {
          rarity: true,
        },
      },
    },
  });
}

// 4. Open a chest (simplified)
export async function openChest(db: any, playerId: string, chestName: string) {
  // Get chest info
  const chest = await db.query.chestTypes.findFirst({
    where: eq(chestTypes.name, chestName),
  });

  // Get available loot for this chest
  const availableLoot = await getChestLoot(db, chestName);

  // Weighted random selection logic here...
  const selectedItem = selectRandomItemByWeight(availableLoot);

  // Give player the item
  await givePlayerItem(db, playerId, selectedItem.itemType.id);

  // Record the opening
  await db.insert(chestOpenings).values({
    playerId,
    chestTypeId: chest.id,
    costPaid: chest.cost,
    currencyType: chest.currencyType,
    itemsReceived: [selectedItem.itemType.id],
  });
}

function selectRandomItemByWeight(lootTable: any[]) {
  // Implement weighted random selection
  const totalWeight = lootTable.reduce((sum, item) => sum + item.dropWeight, 0);
  let random = Math.random() * totalWeight;

  for (const item of lootTable) {
    random -= item.dropWeight;
    if (random <= 0) return item;
  }

  return lootTable[0]; // fallback
}

// Helper function to give player an item
export async function givePlayerItem(
  db: any,
  playerId: string,
  itemTypeId: string
) {
  const playerItem = await db
    .insert(playerItems)
    .values({
      playerId,
      itemTypeId,
      isEquipped: false, // They need to manually equip it
    })
    .returning();

  return playerItem[0];
}
