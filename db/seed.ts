import { db } from "./index";
import { rarities, itemTypes, chestTypes, chestLootTable } from "./schema";

async function seed() {
  try {
    // Create rarities
    const [common, uncommon, rare, epic] = await db
      .insert(rarities)
      .values([
        {
          name: "common",
          dropWeight: 70,
          colorHex: "#808080", // Gray
        },
        {
          name: "uncommon",
          dropWeight: 20,
          colorHex: "#00FF00", // Green
        },
        {
          name: "rare",
          dropWeight: 8,
          colorHex: "#0000FF", // Blue
        },
        {
          name: "epic",
          dropWeight: 2,
          colorHex: "#800080", // Purple
        },
      ])
      .returning();

    // Create swords
    const [sword1, sword2, sword3, sword4] = await db
      .insert(itemTypes)
      .values([
        {
          name: "Common Sword",
          imageUrl: "https://example.com/sword1.png",
          rarityId: common.id,
          slot: "weapon",
          attributes: { damage: 10, speed: 1.0 },
        },
        {
          name: "Uncommon Sword",
          imageUrl: "https://example.com/sword2.png",
          rarityId: uncommon.id,
          slot: "weapon",
          attributes: { damage: 15, speed: 1.1 },
        },
        {
          name: "Rare Sword",
          imageUrl: "https://example.com/sword3.png",
          rarityId: rare.id,
          slot: "weapon",
          attributes: { damage: 20, speed: 1.2 },
        },
        {
          name: "Epic Sword",
          imageUrl: "https://example.com/sword4.png",
          rarityId: epic.id,
          slot: "weapon",
          attributes: { damage: 25, speed: 1.3 },
        },
      ])
      .returning();

    // Create starter chest
    const [starterChest] = await db
      .insert(chestTypes)
      .values({
        name: "starter",
        displayName: "Starter Chest",
        cost: 0,
        currencyType: "coins",
      })
      .returning();

    // Add swords to chest
    await db.insert(chestLootTable).values([
      {
        chestTypeId: starterChest.id,
        itemTypeId: sword1.id,
        dropWeight: 70,
      },
      {
        chestTypeId: starterChest.id,
        itemTypeId: sword2.id,
        dropWeight: 20,
      },
      {
        chestTypeId: starterChest.id,
        itemTypeId: sword3.id,
        dropWeight: 8,
      },
      {
        chestTypeId: starterChest.id,
        itemTypeId: sword4.id,
        dropWeight: 2,
      },
    ]);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
