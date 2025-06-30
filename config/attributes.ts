// All attribute definitions in one place
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

// Helper functions
export function getAttributeValue(attributeKey: AttributeKey): number {
  return ATTRIBUTE_CONFIG[attributeKey].value;
}

export function getAttributeDisplay(attributeKey: AttributeKey): string {
  return ATTRIBUTE_CONFIG[attributeKey].displayName;
}
