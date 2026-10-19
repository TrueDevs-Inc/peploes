import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";
import { publishedEvent } from "@/__tests__/fixtures/seasonal";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  fetchSeasonalEntries,
  fetchSeasonalEntry,
  fetchSeasonalEntryExists,
  fetchWhatsOnPage,
} from "@/lib/sanity-provider";
import {
  getSeasonalEntries,
  getSeasonalEntry,
  getWhatsOnPage,
  seasonalEntryExists,
} from "@/services/seasonal";

vi.mock("@/lib/sanity-provider", () => ({
  fetchSeasonalEntries: vi.fn(),
  fetchSeasonalEntry: vi.fn(),
  fetchSeasonalEntryExists: vi.fn(),
  fetchWhatsOnPage: vi.fn(),
}));

describe("published events", () => {
  it("loads an event without filling optional sections from design fixtures", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(ok([publishedEvent]));
    const result = await getSeasonalEntry("sample");
    expect(result.isOk() ? result.value.menu : "failed").toBeUndefined();
  });
  it("returns not found for unpublished or disabled content", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(ok([]));
    const result = await getSeasonalEntry("sample");
    expect(result.isErr() ? result.error.code : null).toBe(ErrorCode.NotFound);
  });
  it("rejects duplicate published URLs", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(
      ok([publishedEvent, publishedEvent]),
    );
    expect((await getSeasonalEntry("sample")).isErr()).toBe(true);
  });
  it("rejects a response belonging to another URL", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(
      ok([{ ...publishedEvent, slug: "another" }]),
    );
    expect((await getSeasonalEntry("sample")).isErr()).toBe(true);
  });
  it("reports malformed content instead of showing placeholder copy", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(
      ok([{ ...publishedEvent, hero: null }]),
    );
    expect((await getSeasonalEntry("sample")).isErr()).toBe(true);
  });
  it("does not replace a network failure with preview content", async () => {
    vi.mocked(fetchSeasonalEntry).mockResolvedValue(
      err(createError(ErrorCode.InternalError, "Unavailable")),
    );
    const result = await getSeasonalEntry("sample");
    expect(result.isErr() ? result.error.message : null).toBe("Unavailable");
  });
  it("keeps an empty diary empty", async () => {
    vi.mocked(fetchSeasonalEntries).mockResolvedValue(ok([]));
    const result = await getSeasonalEntries();
    expect(result.isOk() ? result.value : null).toEqual([]);
  });
  it("rejects duplicate list URLs", async () => {
    vi.mocked(fetchSeasonalEntries).mockResolvedValue(
      ok([publishedEvent, { ...publishedEvent, _id: "second" }]),
    );
    expect((await getSeasonalEntries()).isErr()).toBe(true);
  });
  it("uses shared design defaults only when no settings exist", async () => {
    vi.mocked(fetchWhatsOnPage).mockResolvedValue(ok(null));
    const result = await getWhatsOnPage();
    expect(result.isOk() ? result.value.diary.heading : null).toBe(
      "In the diary.",
    );
  });
  it("reports broken settings instead of masking them", async () => {
    vi.mocked(fetchWhatsOnPage).mockResolvedValue(ok({ hero: null }));
    expect((await getWhatsOnPage()).isErr()).toBe(true);
  });
});

it("does not report a missing event when the availability check fails", async () => {
  vi.mocked(fetchSeasonalEntryExists).mockResolvedValue(
    err(createError(ErrorCode.InternalError, "Unavailable")),
  );
  expect((await seasonalEntryExists("sample")).isErr()).toBe(true);
});
it("reports an unpublished event as unavailable before streaming starts", async () => {
  vi.mocked(fetchSeasonalEntryExists).mockResolvedValue(ok(false));
  const result = await seasonalEntryExists("sample");
  expect(result.isOk() ? result.value : null).toBe(false);
});
