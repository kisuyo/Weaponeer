export const Rarities = [
  { id: "common", name: "Common", dropWeight: 100, colorHex: "#9CA3AF" },
  { id: "uncommon", name: "Uncommon", dropWeight: 50, colorHex: "#10B981" },
  { id: "rare", name: "Rare", dropWeight: 25, colorHex: "#3B82F6" },
  { id: "epic", name: "Epic", dropWeight: 10, colorHex: "#8B5CF6" },
  { id: "legendary", name: "Legendary", dropWeight: 5, colorHex: "#F59E0B" },
  { id: "mythic", name: "Mythic", dropWeight: 1, colorHex: "#EF4444" },
] as const;

export type RarityId = (typeof Rarities)[number]["id"];

export function getRarityById(id: RarityId) {
  return Rarities.find((rarity) => rarity.id === id);
}
