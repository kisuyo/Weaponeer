import { AttributeKey } from "./attributes";
import { RarityId } from "./rarities";

export interface SwordType {
  id: string;
  name: string;
  damage: number;
  rarity: RarityId;
  imageUrl: string;
  attributes: AttributeKey[];
}

export const SwordTypes: SwordType[] = [
  {
    id: "fire",
    name: "Fire Sword",
    damage: 10,
    rarity: "rare",
    imageUrl: "fire_sword.png",
    attributes: ["coins_per_tap_1", "luck_10"],
  },
  {
    id: "ice",
    name: "Ice Blade",
    damage: 8,
    rarity: "uncommon",
    imageUrl: "ice_blade.png",
    attributes: ["offline_storage_100"],
  },
  {
    id: "void",
    name: "Void Katana",
    damage: 20,
    rarity: "legendary",
    imageUrl: "void_katana.png",
    attributes: ["coins_per_tap_3", "offline_storage_1000", "auto_tap"],
  },
  {
    id: "thunder",
    name: "Thunder Blade",
    damage: 15,
    rarity: "epic",
    imageUrl: "thunder_blade.png",
    attributes: ["coins_per_tap_2", "crit_chance_5"],
  },
  {
    id: "dragon",
    name: "Dragon Slayer",
    damage: 25,
    rarity: "mythic",
    imageUrl: "dragon_slayer.png",
    attributes: [
      "coins_per_tap_3",
      "offline_storage_1000",
      "luck_50",
      "auto_tap",
    ],
  },
  {
    id: "wooden",
    name: "Wooden Sword",
    damage: 1,
    rarity: "common",
    imageUrl: "wooden_sword.png",
    attributes: [],
  },
];

export function getSwordById(id: string): SwordType | undefined {
  return SwordTypes.find((sword) => sword.id === id);
}

export function getSwordsByRarity(rarity: RarityId): SwordType[] {
  return SwordTypes.filter((sword) => sword.rarity === rarity);
}
