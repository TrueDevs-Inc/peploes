import { describe, expect, it } from "vitest";
import { publishedEvent } from "@/__tests__/fixtures/seasonal";
import {
  getSeasonalEventContent,
  groupSeasonalEntries,
  upcomingSeasonalEntries,
} from "@/lib/seasonal-data";
import { seasonalEntrySchema } from "@/lib/seasonal-schema";

describe("event presentation", () => {
  it("keeps the same month in different years separate and sorts by date", () => {
    const first = seasonalEntrySchema.parse({
      ...publishedEvent,
      date: "2027-01-01",
    });
    const second = seasonalEntrySchema.parse({
      ...publishedEvent,
      _id: "next",
      date: "2028-01-01",
    });
    expect(
      groupSeasonalEntries([second, first]).map((month) => month.key),
    ).toEqual(["2027-01", "2028-01"]);
  });
  it("links a menu to its existing page and omits an empty related section", () => {
    const entry = seasonalEntrySchema.parse({
      ...publishedEvent,
      menu: {
        eyebrow: "Food",
        heading: "Menu",
        description: "Dinner menu",
        cards: [
          {
            _key: "dinner",
            title: "Dinner",
            description: "Dinner menu",
            action: "View Menu",
            menu: "dinner",
            image: publishedEvent.hero.image,
          },
        ],
      },
      related: { eyebrow: "More", action: "Read more", cards: [] },
    });
    expect(getSeasonalEventContent(entry).menu?.cards[0].href).toBe(
      "/menus/dinner",
    );
    expect(getSeasonalEventContent(entry).related).toBeUndefined();
  });
});

it("keeps ongoing campaigns through their end date and removes past diary items", () => {
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    date: "2026-11-01",
    endDate: "2026-12-01",
  });
  const expired = seasonalEntrySchema.parse({
    ...publishedEvent,
    _id: "past",
    date: "2026-11-01",
  });
  expect(
    upcomingSeasonalEntries([entry, expired], "2026-12-01").map(
      (item) => item._id,
    ),
  ).toEqual(["sample"]);
  expect(upcomingSeasonalEntries([entry], "2026-12-02")).toEqual([]);
});

it("preserves identities for cards with duplicate editable titles", () => {
  const card = {
    title: "Menu",
    description: "Dinner menu",
    action: "View Menu",
    menu: "dinner",
    image: publishedEvent.hero.image,
  };
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    menu: {
      eyebrow: "Food",
      heading: "Menus",
      description: "Menus",
      cards: [
        { ...card, _key: "first" },
        { ...card, _key: "second" },
      ],
    },
  });
  expect(
    getSeasonalEventContent(entry).menu?.cards.map((item) => item.id),
  ).toEqual(["first", "second"]);
});

it("allows repeated paragraph text with stable identities", () => {
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    story: {
      eyebrow: "Story",
      heading: "Our story",
      image: publishedEvent.hero.image,
      paragraphs: [
        { _key: "one", text: "Same copy" },
        { _key: "two", text: "Same copy" },
      ],
    },
  });
  expect(
    getSeasonalEventContent(entry).story?.paragraphs.map((p) => p._key),
  ).toEqual(["one", "two"]);
});

it("keeps on-page menu highlights without requiring a destination", () => {
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    menu: {
      eyebrow: "Food & Drink",
      heading: "Menu & Experience",
      description: "A taste of what to expect",
      cards: [
        {
          _type: "seasonalMenuHighlight",
          _key: "highlight",
          title: "Seasonal dishes",
          description: "A short introduction to featured dishes.",
          image: publishedEvent.hero.image,
        },
      ],
    },
  });
  const card = getSeasonalEventContent(entry).menu?.cards[0];
  expect(card?.title).toBe("Seasonal dishes");
  expect(card?.href).toBeUndefined();
});

it("mixes published events with existing menu and group pages in More to Explore", () => {
  const pageCard = {
    _type: "seasonalRelatedPage",
    title: "Explore",
    description: "Learn more",
    action: "Explore",
    image: publishedEvent.hero.image,
  };
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    related: {
      eyebrow: "More to Explore",
      action: "Find Out More",
      cards: [
        publishedEvent,
        { ...pageCard, _key: "wine", href: "/menus/wine" },
        {
          ...pageCard,
          _key: "groups",
          href: "/private-dining/groups-celebrations",
        },
      ],
    },
  });
  expect(
    getSeasonalEventContent(entry).related?.cards.map((card) => card.href),
  ).toEqual([
    "/seasonal/sample",
    "/menus/wine",
    "/private-dining/groups-celebrations",
  ]);
});

it("rejects unsafe or unavailable related-page destinations", () => {
  for (const href of [
    "javascript:alert(1)",
    "https://example.com",
    "/journal",
    "/not-a-page",
  ]) {
    const result = seasonalEntrySchema.safeParse({
      ...publishedEvent,
      related: {
        eyebrow: "More",
        action: "Explore",
        cards: [
          {
            _type: "seasonalRelatedPage",
            _key: "page",
            title: "Page",
            description: "Copy",
            action: "Explore",
            image: publishedEvent.hero.image,
            href,
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  }
});

it("preserves individual diary link labels and the original month-only headings", () => {
  const entry = seasonalEntrySchema.parse({
    ...publishedEvent,
    action: "View menus & details",
  });
  const [month] = groupSeasonalEntries([entry]);
  expect(month.name).toBe("December");
  expect(month.events[0].action).toBe("View menus & details");
});
