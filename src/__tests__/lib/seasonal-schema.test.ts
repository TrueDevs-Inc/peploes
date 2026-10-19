import { describe, expect, it } from "vitest";
import { seasonalEntrySchema } from "@/lib/seasonal-schema";

const entry = {
  _id: "test-event",
  _updatedAt: "2026-10-19T12:00:00Z",
  kind: "event",
  slug: "test-event",
  title: "Test event",
  date: "2026-12-01",
  category: "Wine dinner",
  summary: "Development example",
  seoDescription: "Development example",
  noIndex: true,
  hero: {
    eyebrow: "Event",
    heading: "Test event",
    description: "Development example",
    image: {
      src: "https://cdn.sanity.io/images/project/development/test.jpg",
      alt: "Dining room",
    },
  },
};

describe("seasonal CMS content", () => {
  it("accepts a minimal event without optional sections", () => {
    expect(seasonalEntrySchema.safeParse(entry).success).toBe(true);
  });
  it("rejects an impossible calendar date", () => {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, date: "2026-02-30" }).success,
    ).toBe(false);
  });
  it("rejects an end date before the start", () => {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, endDate: "2026-11-30" })
        .success,
    ).toBe(false);
  });
  it("rejects a slug that could escape the event path", () => {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, slug: "../menus" }).success,
    ).toBe(false);
  });
  it("rejects an unsupported content variant", () => {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, kind: "journal" }).success,
    ).toBe(false);
  });
  it("keeps test entries out of search unless explicitly enabled", () => {
    const parsed = seasonalEntrySchema.parse({ ...entry, noIndex: undefined });
    expect(parsed.noIndex).toBe(true);
  });
});

it("supports the Figma gallery's three to five photographs", () => {
  const gallery = (count: number) => ({
    eyebrow: "Gallery",
    heading: "Moments at Peploe's",
    images: Array.from({ length: count }, (_, index) => ({
      ...entry.hero.image,
      _key: `photo-${index}`,
    })),
  });
  for (const count of [3, 4, 5]) {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, gallery: gallery(count) })
        .success,
    ).toBe(true);
  }
  for (const count of [0, 2, 6]) {
    expect(
      seasonalEntrySchema.safeParse({ ...entry, gallery: gallery(count) })
        .success,
    ).toBe(false);
  }
});

it("treats an empty diary label as unset so the shared label can be used", () => {
  expect(
    seasonalEntrySchema.parse({ ...entry, action: "  " }).action,
  ).toBeUndefined();
});
