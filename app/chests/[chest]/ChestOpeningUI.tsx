"use client";

import { useEffect, useState } from "react";
import { useAnimate } from "framer-motion";
import { $openChest } from "@/app/actions/actions";

type ReceivedItem = {
  id: string;
  name: string;
  imageUrl: string;
  rarity: {
    name: string;
    colorHex: string;
  };
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
  },
  {
    id: "uncommonSword1",
    name: "Uncommon Sword",
    imageUrl: "https://example.com/sword2.png",
    rarity: { name: "uncommon", colorHex: "#00FF00" },
  },
  {
    id: "rareSword1",
    name: "Rare Sword",
    imageUrl: "https://example.com/sword3.png",
    rarity: { name: "rare", colorHex: "#0000FF" },
  },
  {
    id: "epicSword1",
    name: "Epic Sword",
    imageUrl: "https://example.com/sword4.png",
    rarity: { name: "epic", colorHex: "#800080" },
  },
];

// Create an array of items based on their drop rates
function createItemPool(items: ReceivedItem[]): ReceivedItem[] {
  const pool: ReceivedItem[] = [];

  // Add items multiple times based on their drop rates
  items.forEach((item) => {
    const count =
      item.rarity.name === "common"
        ? 70
        : item.rarity.name === "uncommon"
        ? 20
        : item.rarity.name === "rare"
        ? 8
        : 2;

    for (let i = 0; i < count; i++) {
      pool.push({ ...item, id: `${item.rarity.name}Sword${i + 1}` });
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
        // Create item pool
        const pool = createItemPool(sampleItems);
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

    // Function to check which item is under the center line
    const checkCenterItem = () => {
      const centerX = window.innerWidth / 2;
      const itemPoolRect = itemPoolElement.getBoundingClientRect();
      const itemPoolLeft = itemPoolRect.left;

      for (const { id, element } of itemPositions) {
        const rect = element.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;

        // If item center is within 20px of the center line
        if (Math.abs(itemCenter - centerX) < 20) {
          if (currentItemId !== id) {
            console.log("Current item under center:", id);
            setCurrentItemId(id);
          }
          break;
        }
      }
    };

    // Start animation
    await animate(
      "#item-pool",
      {
        x: [0, -4000],
      },
      {
        duration: 4,
        ease: [0.2, 0.8, 0.2, 1],
        onComplete: () => {
          // Get the current item under center directly
          const centerX = window.innerWidth / 2;
          const itemPoolElement = document.getElementById("item-pool");
          if (!itemPoolElement) return;

          const items = itemPoolElement.getElementsByClassName("item-card");
          let finalItemId = null;

          for (const item of items) {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;

            if (Math.abs(itemCenter - centerX) < 20) {
              finalItemId = item.getAttribute("data-id");
              break;
            }
          }

          if (finalItemId) {
            const receivedItem = itemPool.find(
              (item) => item.id === finalItemId
            );
            if (receivedItem) {
              console.log("Setting received item:", receivedItem);
              setReceivedItem(receivedItem);
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
            <div>
              <div className="font-bold">{receivedItem.name}</div>
              <div className="text-sm opacity-80">
                {receivedItem.rarity.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
