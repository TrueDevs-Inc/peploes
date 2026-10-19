import "server-only";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  fetchSeasonalEntries,
  fetchSeasonalEntry,
  fetchSeasonalEntryExists,
  fetchWhatsOnPage,
} from "@/lib/sanity-provider";
import {
  seasonalCardSchema,
  seasonalEntrySchema,
  seasonalSlugSchema,
  whatsOnPageSchema,
} from "@/lib/seasonal-schema";
import type {
  IError,
  TSeasonalCard,
  TSeasonalEntry,
  TWhatsOnPage,
} from "@/lib/types";

export async function getSeasonalEntries(): Promise<
  Result<TSeasonalCard[], IError>
> {
  const result = await fetchSeasonalEntries();
  if (result.isErr()) return err(result.error);
  const parsed = z
    .array(seasonalCardSchema)
    .refine(
      (entries) =>
        new Set(entries.map((entry) => entry.slug)).size === entries.length,
      "Published event URL names must be unique.",
    )
    .safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load the event list.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function getSeasonalEntry(
  slug: string,
): Promise<Result<TSeasonalEntry, IError>> {
  if (!seasonalSlugSchema.safeParse(slug).success)
    return err(createError(ErrorCode.NotFound, "Event not found."));
  const result = await fetchSeasonalEntry(slug);
  if (result.isErr()) return err(result.error);
  const documents = z.array(z.unknown()).safeParse(result.value);
  if (!documents.success)
    return err(createError(ErrorCode.InternalError, "Invalid event response."));
  if (documents.data.length === 0)
    return err(createError(ErrorCode.NotFound, "Event not found."));
  if (documents.data.length !== 1)
    return err(
      createError(
        ErrorCode.InternalError,
        "More than one published event uses this URL name.",
      ),
    );
  const parsed = seasonalEntrySchema.safeParse(documents.data[0]);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load the event content.",
        parsed.error,
      ),
    );
  if (parsed.data.slug !== slug)
    return err(
      createError(ErrorCode.InternalError, "The event URL does not match."),
    );
  return ok(parsed.data);
}

export async function getWhatsOnPage(): Promise<Result<TWhatsOnPage, IError>> {
  const result = await fetchWhatsOnPage();
  if (result.isErr()) return err(result.error);
  if (result.value === null) return ok(SEASONAL_CONTENT);
  const parsed = whatsOnPageSchema.safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load What’s On settings.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function seasonalEntryExists(
  slug: string,
): Promise<Result<boolean, IError>> {
  if (!seasonalSlugSchema.safeParse(slug).success) return ok(false);
  const result = await fetchSeasonalEntryExists(slug);
  if (result.isErr()) return err(result.error);
  const parsed = z.boolean().safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Invalid event availability response.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}
