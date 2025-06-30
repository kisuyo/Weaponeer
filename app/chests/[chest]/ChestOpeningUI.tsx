"use client";

import { useEffect, useState } from "react";
import { useAnimate } from "framer-motion";
import { $openChest, $getChestContents } from "@/app/actions/actions";
import { ATTRIBUTE_CONFIG } from "@/config/attributes";
import { SwordTypes } from "@/config/swords";
import { ChestTypes } from "@/config/chests";

type ReceivedItem = {
  id: string;
  name: string;
  imageUrl: string;
  rarity: {
    name: string;
    colorHex: string;
  };
  attributes?: string[];
};

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
    items: ReceivedItem[];
  };
  error?: string;
};

type OpenChestSuccess = {
  success: true;
  data: {
    item: ReceivedItem;
  };
};

type OpenChestError = {
  success: false;
  error: string;
};

type OpenChestResult = OpenChestSuccess | OpenChestError;
type OpenChestResponse = [OpenChestResult | null, { message: string } | null];

function isOpenChestError(
  result: OpenChestResult | null
): result is OpenChestError {
  return result !== null && !result.success;
}

// Sample items for the pool
const sampleItems = [
  {
    id: "commonSword1",
    name: "Common Sword",
    imageUrl: "https://example.com/sword1.png",
    rarity: { name: "common", colorHex: "#808080" },
    attributes: [],
  },
  {
    id: "uncommonSword1",
    name: "Uncommon Sword",
    imageUrl: "https://example.com/sword2.png",
    rarity: { name: "uncommon", colorHex: "#00FF00" },
    attributes: ["offline_storage_500"],
  },
  {
    id: "rareSword1",
    name: "Rare Sword",
    imageUrl: "https://example.com/sword3.png",
    rarity: { name: "rare", colorHex: "#0000FF" },
    attributes: ["offline_storage_1000", "extra_taps_3"],
  },
  {
    id: "epicSword1",
    name: "Epic Sword",
    imageUrl: "https://example.com/sword4.png",
    rarity: { name: "epic", colorHex: "#800080" },
    attributes: ["offline_storage_1000", "extra_taps_5", "luck_50"],
  },
];

// Create an array of items based on their drop rates
function createItemPool(
  items: ReceivedItem[],
  chestDropWeights: Record<string, number>
): ReceivedItem[] {
  const pool: ReceivedItem[] = [];

  // Group items by rarity
  const itemsByRarity = items.reduce((acc, item) => {
    if (!acc[item.rarity.name]) {
      acc[item.rarity.name] = [];
    }
    acc[item.rarity.name].push(item);
    return acc;
  }, {} as Record<string, ReceivedItem[]>);

  // Add items with proper probability distribution based on chest drop weights
  Object.entries(itemsByRarity).forEach(([rarity, items]) => {
    const totalWeight = chestDropWeights[rarity] || 0;

    if (totalWeight > 0) {
      // Distribute weight evenly among items of the same rarity
      const weightPerItem = totalWeight / items.length;

      // Add each item to the pool with its share of the weight
      items.forEach((item, index) => {
        const count = Math.ceil(weightPerItem);
        for (let i = 0; i < count; i++) {
          // Create a unique ID by combining rarity, item index, and instance number
          const uniqueId = `${item.rarity.name}_${index + 1}_${i + 1}`;
          pool.push({ ...item, id: uniqueId });
        }
      });
    }
  });

  // Shuffle the array
  return pool.sort(() => Math.random() - 0.5);
}

export default function ChestOpeningUI({
  chestName,
  actualChestName,
}: {
  chestName: string;
  actualChestName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemPool, setItemPool] = useState<ReceivedItem[]>([]);
  const [scope, animate] = useAnimate();
  const [receivedItem, setReceivedItem] = useState<ReceivedItem | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [possibleItems, setPossibleItems] = useState<ReceivedItem[]>([]);
  const [chestData, setChestData] = useState<any>(null);

  // Load possible items when component mounts
  useEffect(() => {
    const loadPossibleItems = async () => {
      try {
        const [result, err] = (await $getChestContents({
          chestName: actualChestName,
        })) as [GetChestContentsResult | null, { message: string } | null];

        if (err) {
          console.error("Error getting chest contents:", err);
          return;
        }

        if (result?.success && result.data) {
          setChestData(result.data.chest);
          setPossibleItems(result.data.items);
        }
      } catch (error) {
        console.error("Error loading possible items:", error);
      }
    };

    loadPossibleItems();
  }, [actualChestName]);

  useEffect(() => {
    if (spinning) {
      animateItemPool();
    }
  }, [spinning]);

  const handleOpenChest = async () => {
    console.log("Starting chest opening...");
    setLoading(true);
    setError(null);
    setReceivedItem(null);

    try {
      const [result, err] = (await $openChest({
        playerId: "test-player-1", // TODO: Get from auth context
        chestName: actualChestName,
      })) as OpenChestResponse;

      if (err) {
        console.error("Error opening chest:", err);
        setError(err.message);
        return;
      }

      if (result?.success && result.data?.item) {
        console.log("Chest opened successfully, creating item pool...");
        // Get chest drop weights from config
        const chest = ChestTypes.find((c) => c.name === actualChestName);
        const dropWeights = chest?.dropWeights || {};

        // Create item pool with actual items from the chest
        const pool = createItemPool(possibleItems, dropWeights);
        console.log("Item pool created with", pool.length, "items");
        setItemPool(pool);
      } else if (result && !result.success) {
        const errorResult = result as OpenChestError;
        console.error("Failed to open chest:", errorResult.error);
        setError(errorResult.error || "Failed to open chest");
      } else {
        setError("Failed to open chest");
      }
    } catch (err) {
      console.error("Error in chest opening:", err);
      setError("An error occurred while opening the chest");
    } finally {
      setLoading(false);
      setSpinning(true);
    }
  };

  const animateItemPool = async () => {
    console.log("Animating item pool");
    const itemPoolElement = document.getElementById("item-pool");
    if (!itemPoolElement) return;

    // Get all item elements
    const items = itemPoolElement.getElementsByClassName("item-card");
    const itemPositions = Array.from(items).map((item) => ({
      id: item.getAttribute("data-id"),
      element: item,
    }));

    // Start animation
    await animate(
      "#item-pool",
      {
        x: [0, -4100],
      },
      {
        duration: 4,
        ease: [0.2, 0.8, 0.2, 1],
        onComplete: () => {
          // Get the current item under center directly
          const centerX = window.innerWidth / 2;
          console.log("Center X:", centerX);
          const itemPoolElement = document.getElementById("item-pool");
          if (!itemPoolElement) return;

          const items = itemPoolElement.getElementsByClassName("item-card");
          let finalItemId = null;
          let minDistance = Infinity;

          // Find the item closest to the center
          for (const item of items) {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;
            const distance = Math.abs(itemCenter - centerX);

            if (distance < minDistance) {
              minDistance = distance;
              finalItemId = item.getAttribute("data-id");
            }
          }

          console.log("Final item ID:", finalItemId);
          console.log("Min distance:", minDistance);

          if (finalItemId) {
            // Extract the base item ID (without the instance number)
            const baseId = finalItemId.split("_").slice(0, 2).join("_");
            const receivedItem = itemPool.find((item) =>
              item.id.startsWith(baseId)
            );

            if (receivedItem) {
              console.log("Setting received item:", receivedItem);
              setReceivedItem(receivedItem);
            } else {
              console.error("Could not find item with ID:", finalItemId);
            }
          }
          setSpinning(false);
        },
      }
    );
  };

  return (
    <div
      ref={scope}
      className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm"
    >
      <h1 className="text-4xl font-bold mb-8">Open {chestName} Chest</h1>

      {/* Show possible items */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Possible Items:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {possibleItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-white/10"
              style={{ backgroundColor: `${item.rarity.colorHex}20` }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded mb-2"
                  style={{ backgroundColor: item.rarity.colorHex }}
                />
                <div className="font-bold text-center">{item.name}</div>
                <div
                  className="text-sm"
                  style={{ color: item.rarity.colorHex }}
                >
                  {item.rarity.name}
                </div>
                {item.attributes && item.attributes.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {item.attributes.map((attrKey: string, index: number) => {
                      // Use ATTRIBUTE_CONFIG to get display and value
                      const attrConfig =
                        ATTRIBUTE_CONFIG[
                          attrKey as keyof typeof ATTRIBUTE_CONFIG
                        ];
                      if (!attrConfig) return null;
                      return (
                        <div
                          key={index}
                          className="text-xs"
                          style={{ color: item.rarity.colorHex }}
                        >
                          {attrConfig.displayName}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">
                    No attributes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={handleOpenChest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Opening..." : "Open Chest"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {itemPool.length > 0 && (
        <div className="flex flex-row overflow-x-hidden relative">
          <div className="flex flex-row" id="item-pool">
            {itemPool.map((item) => (
              <div
                key={item.id}
                data-id={item.id}
                className="px-2 w-fit bg-red-500 flex-shrink-0 relative item-card"
              >
                <div
                  className="min-w-32 h-32 rounded-lg overflow-hidden border-2 border-white/10"
                  style={{
                    backgroundColor: item.rarity.colorHex,
                  }}
                >
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4 text-white">
                    <div className="text-lg font-bold">{item.name}</div>
                    <div className="text-sm opacity-80">{item.rarity.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-[50%] translate-x-[-50%] h-full w-1 bg-green-500 z-10" />
        </div>
      )}

      {receivedItem && (
        <div className="mt-8 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Received Item:</h2>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded"
              style={{ backgroundColor: receivedItem.rarity.colorHex }}
            />
            <div className="flex-1">
              <div className="font-bold">{receivedItem.name}</div>
              <div className="text-sm opacity-80">
                {receivedItem.rarity.name}
              </div>
              <div className="mt-2">
                {receivedItem.attributes &&
                receivedItem.attributes.length > 0 ? (
                  receivedItem.attributes.map(
                    (attrKey: string, index: number) => {
                      const attrConfig =
                        ATTRIBUTE_CONFIG[
                          attrKey as keyof typeof ATTRIBUTE_CONFIG
                        ];
                      if (!attrConfig) return null;
                      return (
                        <div
                          key={index}
                          className="text-sm"
                          style={{ color: receivedItem.rarity.colorHex }}
                        >
                          {attrConfig.displayName}
                        </div>
                      );
                    }
                  )
                ) : (
                  <div className="text-sm text-gray-500">No attributes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
