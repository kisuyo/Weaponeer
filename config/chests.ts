import { RarityId } from "./rarities";

export interface ChestType {
  id: string;
  name: string;
  displayName: string;
  cost: number;
  currencyType: "coins" | "gems";
  guaranteedRarityMin?: RarityId;
  dropWeights: Record<RarityId, number>;
}

export const ChestTypes: ChestType[] = [
  {
    id: "basic",
    name: "Basic Chest",
    displayName: "Basic Chest",
    cost: 100,
    currencyType: "coins",
    dropWeights: {
      common: 70,
      uncommon: 25,
      rare: 5,
      epic: 0,
      legendary: 0,
      mythic: 0,
    },
  },
  {
    id: "premium",
    name: "Premium Chest",
    displayName: "Premium Chest",
    cost: 500,
    currencyType: "coins",
    guaranteedRarityMin: "uncommon",
    dropWeights: {
      common: 0,
      uncommon: 60,
      rare: 30,
      epic: 10,
      legendary: 0,
      mythic: 0,
    },
  },
  {
    id: "legendary",
    name: "Legendary Chest",
    displayName: "Legendary Chest",
    cost: 50,
    currencyType: "gems",
    guaranteedRarityMin: "rare",
    dropWeights: {
      common: 0,
      uncommon: 0,
      rare: 50,
      epic: 35,
      legendary: 15,
      mythic: 0,
    },
  },
  {
    id: "mythic",
    name: "Mythic Chest",
    displayName: "Mythic Chest",
    cost: 200,
    currencyType: "gems",
    guaranteedRarityMin: "epic",
    dropWeights: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 60,
      legendary: 35,
      mythic: 5,
    },
  },
];

export function getChestById(id: string): ChestType | undefined {
  return ChestTypes.find((chest) => chest.id === id);
}
