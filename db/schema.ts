import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";
import { relations, and, eq } from "drizzle-orm";
import { SwordTypes } from "@/config/swords";
import { getAttributeValue } from "@/config/attributes";
import { sql } from "drizzle-orm";

// Players - store calculated totals for performance
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  coins: decimal("coins", { precision: 20, scale: 2 }).default("0"),
  gems: integer("gems").default(0),
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

// Swords owned by players (can have duplicates, ownership can change)
export const swords = pgTable("swords", {
  id: uuid("id").defaultRandom().primaryKey(),
  swordTypeId: text("sword_type_id").notNull(), // References SwordTypes[].id
  ownedBy: uuid("owned_by")
    .references(() => players.id)
    .notNull(),
  isEquipped: boolean("is_equipped").default(false),
  acquiredAt: timestamp("acquired_at").defaultNow(),
  equippedAt: timestamp("equipped_at"),
});

// Chest opening logs - minimal table for analytics and debugging
export const chestOpeningLogs = pgTable("chest_opening_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  playerId: uuid("player_id")
    .references(() => players.id)
    .notNull(),
  chestTypeId: text("chest_type_id").notNull(), // Store as text to avoid foreign key overhead
  receivedItemTypeId: text("received_item_type_id").notNull(), // Store as text
  receivedItemRarity: text("received_item_rarity").notNull(), // Store rarity name directly
  cost: integer("cost").notNull(),
  currencyType: text("currency_type").notNull(), // "coins" or "gems"
  openedAt: timestamp("opened_at").defaultNow(),
});

// Relations
export const playersRelations = relations(players, ({ many }) => ({
  swords: many(swords),
  chestOpeningLogs: many(chestOpeningLogs),
}));

export const swordsRelations = relations(swords, ({ one }) => ({
  owner: one(players, {
    fields: [swords.ownedBy],
    references: [players.id],
  }),
}));

export const chestOpeningLogsRelations = relations(
  chestOpeningLogs,
  ({ one }) => ({
    player: one(players, {
      fields: [chestOpeningLogs.playerId],
      references: [players.id],
    }),
  })
);

// Calculate player totals from equipped swords
export async function recalculatePlayerStats(db: any, playerId: string) {
  const equippedSwords = await db.query.swords.findMany({
    where: and(eq(swords.ownedBy, playerId), eq(swords.isEquipped, true)),
  });

  let totalCoinsPerTap = 0.1; // Base tap value
  let totalOfflineStorage = 100; // Base offline storage
  let totalLuck = 0;
  let totalCritChance = 0;
  let hasAutoTap = false;

  // Sum up all attributes from equipped swords
  for (const playerSword of equippedSwords) {
    const swordType = SwordTypes.find(
      (sword: any) => sword.id === playerSword.swordTypeId
    );
    if (!swordType) continue;

    for (const attr of swordType.attributes) {
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

// Helper function to give a sword to a player
export async function giveSwordToPlayer(
  db: any,
  playerId: string,
  swordTypeId: string,
  equip: boolean = false
) {
  const swordData: any = {
    swordTypeId,
    ownedBy: playerId,
    isEquipped: equip,
  };

  if (equip) {
    swordData.equippedAt = new Date();
  }

  const [newSword] = await db.insert(swords).values(swordData).returning();

  if (equip) {
    await recalculatePlayerStats(db, playerId);
  }

  return newSword;
}

// Helper function to equip/unequip a sword
export async function toggleSwordEquip(
  db: any,
  swordId: string,
  playerId: string
) {
  const sword = await db.query.swords.findFirst({
    where: and(eq(swords.id, swordId), eq(swords.ownedBy, playerId)),
  });

  if (!sword) {
    throw new Error("Sword not found or not owned by player");
  }

  await db
    .update(swords)
    .set({
      isEquipped: !sword.isEquipped,
      equippedAt: !sword.isEquipped ? new Date() : null,
    })
    .where(eq(swords.id, swordId));

  await recalculatePlayerStats(db, playerId);
}

// Helper function to transfer sword ownership
export async function transferSwordOwnership(
  db: any,
  swordId: string,
  fromPlayerId: string,
  toPlayerId: string
) {
  const sword = await db.query.swords.findFirst({
    where: and(eq(swords.id, swordId), eq(swords.ownedBy, fromPlayerId)),
  });

  if (!sword) {
    throw new Error("Sword not found or not owned by source player");
  }

  await db
    .update(swords)
    .set({
      ownedBy: toPlayerId,
      isEquipped: false, // Unequip when transferred
      equippedAt: null,
    })
    .where(eq(swords.id, swordId));

  // Recalculate stats for both players
  await recalculatePlayerStats(db, fromPlayerId);
  await recalculatePlayerStats(db, toPlayerId);
}

// Helper function to log chest opening
export async function logChestOpening(
  db: any,
  playerId: string,
  chestTypeId: string,
  receivedItemTypeId: string,
  receivedItemRarity: string,
  cost: number,
  currencyType: "coins" | "gems"
) {
  try {
    await db.insert(chestOpeningLogs).values({
      playerId,
      chestTypeId,
      receivedItemTypeId,
      receivedItemRarity,
      cost,
      currencyType,
    });
  } catch (error) {
    // Log error but don't fail the chest opening
    console.error("Failed to log chest opening:", error);
  }
}

// Optional: Function to clean old logs (run periodically)
export async function cleanOldChestLogs(db: any, daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    await db
      .delete(chestOpeningLogs)
      .where(sql`${chestOpeningLogs.openedAt} < ${cutoffDate}`);
  } catch (error) {
    console.error("Failed to clean old chest logs:", error);
  }
}
