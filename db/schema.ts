// config/gameConfig.ts - All attribute definitions in one place
export const ATTRIBUTE_CONFIG = {
  // Tap bonuses
  coins_per_tap_1: { value: 0.1, displayName: "+0.1 Coins per Tap" },
  coins_per_tap_2: { value: 0.5, displayName: "+0.5 Coins per Tap" },
  coins_per_tap_3: { value: 1.0, displayName: "+1.0 Coins per Tap" },

  // Offline bonuses
  offline_storage_100: { value: 100, displayName: "+100 Offline Storage" },
  offline_storage_500: { value: 500, displayName: "+500 Offline Storage" },
  offline_storage_1000: { value: 1000, displayName: "+1000 Offline Storage" },

  // Luck bonuses
  luck_10: { value: 10, displayName: "+10% Chest Luck" },
  luck_25: { value: 25, displayName: "+25% Chest Luck" },
  luck_50: { value: 50, displayName: "+50% Chest Luck" },

  // Crit bonuses
  crit_chance_5: { value: 5, displayName: "5% Crit Chance" },
  crit_chance_10: { value: 10, displayName: "10% Crit Chance" },

  // Special abilities
  auto_tap: { value: 1, displayName: "Auto Tap Enabled" },
  double_offline: { value: 2, displayName: "2x Offline Earnings" },
} as const;

export type AttributeKey = keyof typeof ATTRIBUTE_CONFIG;

// Simplified schema - much cleaner!
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
import { relations, and, eq } from "drizzle-orm";

// Rarities
export const rarities = pgTable("rarities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  dropWeight: integer("drop_weight").notNull(),
  colorHex: text("color_hex").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items - much simpler with attributes as array
export const itemTypes = pgTable("item_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  rarityId: uuid("rarity_id")
    .references(() => rarities.id)
    .notNull(),
  slot: text("slot").notNull(), // 'weapon', 'helmet', 'shield', 'cape'
  attributes: jsonb("attributes").$type<AttributeKey[]>().default([]), // ["coins_per_tap_1", "luck_10"]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Players - store calculated totals for performance
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  coins: decimal("coins", { precision: 20, scale: 2 }).default("0"),
  totalTaps: integer("total_taps").default(0),

  // Cached totals from equipped items (recalculated when equipping/unequipping)
  totalCoinsPerTap: decimal("total_coins_per_tap", {
    precision: 10,
    scale: 2,
  }).default("0.1"),
  totalOfflineStorage: integer("total_offline_storage").default(100),
  totalLuck: integer("total_luck").default(0),
  totalCritChance: integer("total_crit_chance").default(0),
  hasAutoTap: boolean("has_auto_tap").default(false),

  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player items
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

// Chest types
export const chestTypes = pgTable("chest_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  cost: integer("cost").notNull(),
  currencyType: text("currency_type").notNull(),
  guaranteedRarityMin: text("guaranteed_rarity_min"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chest loot table
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
    dropWeight: integer("drop_weight").default(1),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    chestItemUnique: primaryKey(table.chestTypeId, table.itemTypeId),
  })
);

// Relations (much simpler now)
export const itemTypesRelations = relations(itemTypes, ({ one, many }) => ({
  rarity: one(rarities, {
    fields: [itemTypes.rarityId],
    references: [rarities.id],
  }),
  playerItems: many(playerItems),
  chestLoot: many(chestLootTable),
}));

export const chestTypesRelations = relations(chestTypes, ({ many }) => ({
  loot: many(chestLootTable),
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

export const raritiesRelations = relations(rarities, ({ many }) => ({
  items: many(itemTypes),
}));

export const playersRelations = relations(players, ({ many }) => ({
  items: many(playerItems),
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

// Helper functions
export function getAttributeValue(attributeKey: AttributeKey): number {
  return ATTRIBUTE_CONFIG[attributeKey].value;
}

export function getAttributeDisplay(attributeKey: AttributeKey): string {
  return ATTRIBUTE_CONFIG[attributeKey].displayName;
}

// Calculate player totals from equipped items
export async function recalculatePlayerStats(db: any, playerId: string) {
  const equippedItems = await db.query.playerItems.findMany({
    where: and(
      eq(playerItems.playerId, playerId),
      eq(playerItems.isEquipped, true)
    ),
    with: {
      itemType: true,
    },
  });

  let totalCoinsPerTap = 0.1; // Base tap value
  let totalOfflineStorage = 100; // Base offline storage
  let totalLuck = 0;
  let totalCritChance = 0;
  let hasAutoTap = false;

  // Sum up all attributes from equipped items
  for (const playerItem of equippedItems) {
    const attributes = playerItem.itemType.attributes as AttributeKey[];

    for (const attr of attributes) {
      const value = getAttributeValue(attr);

      if (attr.startsWith("coins_per_tap_")) {
        totalCoinsPerTap += value;
      } else if (attr.startsWith("offline_storage_")) {
        totalOfflineStorage += value;
      } else if (attr.startsWith("luck_")) {
        totalLuck += value;
      } else if (attr.startsWith("crit_chance_")) {
        totalCritChance += value;
      } else if (attr === "auto_tap") {
        hasAutoTap = true;
      }
    }
  }

  // Update player stats
  await db
    .update(players)
    .set({
      totalCoinsPerTap: totalCoinsPerTap.toString(),
      totalOfflineStorage,
      totalLuck,
      totalCritChance,
      hasAutoTap,
    })
    .where(eq(players.id, playerId));
}

// Easy item creation
export async function createItem(
  db: any,
  itemData: {
    name: string;
    imageUrl: string;
    rarityName: string;
    slot: string;
    attributes: AttributeKey[];
  }
) {
  const rarity = await db.query.rarities.findFirst({
    where: eq(rarities.name, itemData.rarityName),
  });

  return await db
    .insert(itemTypes)
    .values({
      name: itemData.name,
      imageUrl: itemData.imageUrl,
      rarityId: rarity.id,
      slot: itemData.slot,
      attributes: itemData.attributes,
    })
    .returning();
}

// Example usage:
/*
await createItem(db, {
  name: "Mythic Scythe",
  imageUrl: "scythe_mythic.png",
  rarityName: "mythic",
  slot: "weapon",
  attributes: ["coins_per_tap_3", "offline_storage_1000", "auto_tap"]
});
*/
