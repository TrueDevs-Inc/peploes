import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { SEASONAL_EVENT_CONTENT } from "@/lib/constants/seasonal-event";

// Synthetic future dates exercise sorting without pretending to be a real programme.
export const seasonalFixtures = SEASONAL_CONTENT.diary.months
  .flatMap((month, monthIndex) =>
    month.events.map((event) => ({
      ...SEASONAL_EVENT_CONTENT,
      _id: event.slug,
      _updatedAt: "2026-10-19T12:00:00Z",
      title: event.title,
      slug: event.slug,
      kind: "event",
      date: `2099-${monthIndex + 10}-${event.day}`,
      category: event.category,
      summary: event.description,
      action: event.action,
      noIndex: true,
      hero: {
        ...SEASONAL_EVENT_CONTENT.hero,
        heading: event.title,
        description: event.description,
      },
      details: SEASONAL_EVENT_CONTENT.details?.map((detail, index) => ({
        ...detail,
        _key: `detail-${index}`,
        icon: ["date", "time", "price", "menu"][index],
      })),
      menu: {
        ...SEASONAL_EVENT_CONTENT.menu,
        cards: SEASONAL_EVENT_CONTENT.menu?.cards.map((card, index) => ({
          ...card,
          _key: `menu-${index}`,
          menu: index === 0 ? "dinner" : "wine",
        })),
      },
      gallery: SEASONAL_EVENT_CONTENT.gallery
        ? {
            ...SEASONAL_EVENT_CONTENT.gallery,
            images: SEASONAL_EVENT_CONTENT.gallery.images.map(
              (image, index) => ({ ...image, _key: `image-${index}` }),
            ),
          }
        : undefined,
      related: {
        eyebrow: "More to Explore",
        action: "Find Out More",
        cards: SEASONAL_CONTENT.diary.months
          .flatMap((item) =>
            item.events.map((event) => ({
              slug: event.slug,
              title: event.title,
              description: event.description,
            })),
          )
          .slice(1, 4)
          .map((item) => ({
            _id: item.slug,
            slug: item.slug,
            title: item.title,
            summary: item.description,
            hero: SEASONAL_EVENT_CONTENT.hero,
          })),
      },
    })),
  )
  .map((entry) =>
    entry.slug !== "italian-wine-dinner"
      ? entry
      : {
          ...entry,
          details: [],
          story: null,
          invitation: entry.invitation
            ? {
                ...entry.invitation,
                enquiryAction: "Enquire about a gathering",
              }
            : undefined,
          menu: {
            ...entry.menu,
            cards: [
              {
                _type: "seasonalMenuHighlight",
                _key: "highlight",
                title: "A Taste of What to Expect",
                description: "Fresh seasonal dishes paired with Italian wines.",
                image: entry.hero.image,
              },
              ...(entry.menu.cards?.slice(0, 1) ?? []),
            ],
          },
          gallery: entry.gallery
            ? {
                ...entry.gallery,
                images: [
                  ...entry.gallery.images,
                  ...entry.gallery.images.slice(0, 2).map((image, index) => ({
                    ...image,
                    _key: `extra-${index}`,
                  })),
                ],
              }
            : undefined,
          related: {
            ...entry.related,
            cards: [
              entry.related.cards[0],
              {
                _type: "seasonalRelatedPage",
                _key: "wine",
                title: "Explore our wines",
                description: "The wine menu.",
                action: "Explore wines",
                href: "/menus/wine",
                image: entry.hero.image,
              },
              {
                _type: "seasonalRelatedPage",
                _key: "groups",
                title: "Groups & Celebrations",
                description: "Gather at Peploe's.",
                action: "Explore groups",
                href: "/private-dining/groups-celebrations",
                image: entry.hero.image,
              },
            ],
          },
        },
  );

export const seasonalPageFixture = {
  ...SEASONAL_CONTENT,
  join: {
    ...SEASONAL_CONTENT.join,
    bookingAction: "Book a table for your celebration",
    contactAction: "Enquire about your special gathering",
  },
};
