import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { ErrorCode } from "@/lib/enums";
import { unwrapResultOrThrow } from "@/lib/errors";
import {
  getSeasonalEntries,
  getSeasonalEntry,
  getWhatsOnPage,
} from "@/services/seasonal";

const cachedEntries = cache(getSeasonalEntries);
const cachedEntry = cache(getSeasonalEntry);
const cachedSettings = cache(getWhatsOnPage);

export async function loadSeasonalEntries() {
  await connection();
  return unwrapResultOrThrow(await cachedEntries(), "Unable to load events.");
}
export async function loadSeasonalEntry(slug: string) {
  await connection();
  const result = await cachedEntry(slug);
  if (result.isErr() && result.error.code === ErrorCode.NotFound) notFound();
  return unwrapResultOrThrow(result, "Unable to load the event.");
}
export async function loadWhatsOnPage() {
  await connection();
  return unwrapResultOrThrow(
    await cachedSettings(),
    "Unable to load What’s On.",
  );
}
