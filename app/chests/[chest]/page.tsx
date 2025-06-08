import { db } from "@/db";
import { chestTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ChestOpeningUI from "./ChestOpeningUI";

export default async function ChestPage({
  params,
}: {
  params: { chest: string };
}) {
  // Check if chest exists on the server
  const chestData = await db.query.chestTypes.findFirst({
    where: eq(chestTypes.name, params.chest),
  });

  if (!chestData) {
    return <div>Chest not found</div>;
  }

  return (
    <ChestOpeningUI
      chestName={chestData.displayName}
      actualChestName={chestData.name}
    />
  );
}
