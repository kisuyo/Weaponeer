import { ChestTypes } from "@/config/chests";
import { notFound } from "next/navigation";
import ChestOpeningUI from "./ChestOpeningUI";

export default async function ChestPage({
  params,
}: {
  params: Promise<{ chest: string }>;
}) {
  const { chest: chestName } = await params;

  if (!chestName) {
    notFound();
  }

  // Check if chest exists using config file
  const chestData = ChestTypes.find((chest) => chest.id === chestName);

  if (!chestData) {
    notFound();
  }

  return (
    <ChestOpeningUI
      chestName={chestData.displayName}
      actualChestName={chestData.name}
    />
  );
}
