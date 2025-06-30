import { db } from "@/db";
import {
  rarities,
  itemTypes,
  chestTypes,
  chestLootTable,
  playerItems,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ATTRIBUTE_CONFIG, AttributeKey } from "@/db/schema";

// Comprehensive cleanup function
async function cleanupDatabase() {
  console.log("Starting database cleanup...");

  try {
    // Delete in order to respect foreign key constraints
    console.log("Deleting player items...");
    await db.delete(playerItems);

    console.log("Deleting chest loot table...");
    await db.delete(chestLootTable);

    console.log("Deleting item types...");
    await db.delete(itemTypes);

    console.log("Deleting chest types...");
    await db.delete(chestTypes);

    console.log("Deleting rarities...");
    await db.delete(rarities);

    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}

// 2. Add rarities
async function addRarities() {
  const raritiesData = [
    { name: "common", dropWeight: 100, colorHex: "#cccccc" },
    { name: "uncommon", dropWeight: 50, colorHex: "#4caf50" },
    { name: "rare", dropWeight: 20, colorHex: "#2196f3" },
    { name: "epic", dropWeight: 5, colorHex: "#9c27b0" },
    { name: "mythic", dropWeight: 1, colorHex: "#ff9800" },
  ];
  for (const rarity of raritiesData) {
    await db.insert(rarities).values(rarity);
  }
  return await db.query.rarities.findMany();
}

// 3. Add swords (with a random attribute)
async function addSwords(raritiesList) {
  const swordsData = [
    {
      name: "Bronze Sword",
      imageUrl: "bronze_sword.png",
      slot: "weapon",
      rarityName: "common",
    },
    {
      name: "Silver Sword",
      imageUrl: "silver_sword.png",
      slot: "weapon",
      rarityName: "uncommon",
    },
    {
      name: "Golden Sword",
      imageUrl: "golden_sword.png",
      slot: "weapon",
      rarityName: "rare",
    },
    {
      name: "Crystal Sword",
      imageUrl: "crystal_sword.png",
      slot: "weapon",
      rarityName: "epic",
    },
    {
      name: "Mythic Scythe",
      imageUrl: "scythe_mythic.png",
      slot: "weapon",
      rarityName: "mythic",
    },
  ];
  const allAttributeKeys = Object.keys(ATTRIBUTE_CONFIG) as AttributeKey[];
  const createdSwords = [];
  for (const sword of swordsData) {
    const rarity = raritiesList.find((r) => r.name === sword.rarityName);
    if (!rarity) continue;
    const randomAttr =
      allAttributeKeys[Math.floor(Math.random() * allAttributeKeys.length)];
    const [createdSword] = await db
      .insert(itemTypes)
      .values({
        name: sword.name,
        imageUrl: sword.imageUrl,
        rarityId: rarity.id,
        slot: sword.slot,
        attributes: [randomAttr],
      })
      .returning();
    createdSwords.push(createdSword);
  }
  return createdSwords;
}

// 4. Add chests
async function addChests() {
  const chestsData = [
    {
      name: "basic",
      displayName: "Basic Chest",
      cost: 100,
      currencyType: "coins",
      guaranteedRarityMin: "common",
    },
    {
      name: "rare",
      displayName: "Rare Chest",
      cost: 500,
      currencyType: "coins",
      guaranteedRarityMin: "rare",
    },
    {
      name: "epic",
      displayName: "Epic Chest",
      cost: 2000,
      currencyType: "coins",
      guaranteedRarityMin: "epic",
    },
  ];
  for (const chest of chestsData) {
    await db.insert(chestTypes).values(chest);
  }
  return await db.query.chestTypes.findMany();
}

// 5. Add all swords to all chests
async function addSwordsToChests(swords, chests) {
  for (const chest of chests) {
    for (const sword of swords) {
      await db.insert(chestLootTable).values({
        chestTypeId: chest.id,
        itemTypeId: sword.id,
        dropWeight: 1,
      });
    }
  }
}

// MAIN
async function main() {
  try {
    await cleanupDatabase();
    const raritiesList = await addRarities();
    const swords = await addSwords(raritiesList);
    const chests = await addChests();
    await addSwordsToChests(swords, chests);
    console.log(
      "Mock data created: rarities, swords (with attributes), chests, and loot table."
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
