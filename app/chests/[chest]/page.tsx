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
  const chestName = params?.chest;

  if (!chestName) {
    notFound();
  }

  // Check if chest exists on the server
  const chestData = await db.query.chestTypes.findFirst({
    where: eq(chestTypes.name, chestName),
  });

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
