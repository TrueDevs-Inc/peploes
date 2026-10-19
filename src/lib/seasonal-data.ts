import type { Route } from "next";
import { MENU_ROUTES, ROUTES, SEASONAL_DETAIL_ICONS } from "@/lib/constants";
import type {
  ISeasonalEventContent,
  ISeasonalMonth,
  TSeasonalCard,
  TSeasonalEntry,
} from "@/lib/types";

export function seasonalPath(slug: string): Route {
  return `${ROUTES.WHATS_ON}/${slug}` as Route;
}

export function groupSeasonalEntries(
  entries: TSeasonalCard[],
): ISeasonalMonth[] {
  const months = new Map<string, ISeasonalMonth>();
  for (const entry of [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  )) {
    addEntryToMonth(months, entry);
  }
  return [...months.values()];
}

export function getSeasonalEventContent(
  entry: TSeasonalEntry,
): ISeasonalEventContent {
  return {
    ...entry,
    details: entry.details.map((detail) => ({
      ...detail,
      icon: SEASONAL_DETAIL_ICONS[detail.icon],
    })),
    menu: entry.menu?.cards.length
      ? {
          ...entry.menu,
          cards: entry.menu.cards.map((card) => ({
            ...card,
            id: card._key,
            action: "menu" in card ? card.action : "",
            href: "menu" in card ? MENU_ROUTES[card.menu] : undefined,
          })),
        }
      : undefined,
    story: entry.story ?? undefined,
    gallery: entry.gallery ?? undefined,
    invitation: entry.invitation ?? undefined,
    related: entry.related?.cards.length
      ? {
          ...entry.related,
          cards: entry.related.cards.map((card) =>
            "href" in card
              ? { ...card, id: card._key }
              : {
                  id: card._id,
                  title: card.title,
                  description: card.summary,
                  image: card.hero.image,
                  action: entry.related?.action ?? card.title,
                  href: seasonalPath(card.slug),
                },
          ),
        }
      : undefined,
  };
}

export function upcomingSeasonalEntries(
  entries: TSeasonalCard[],
  today: string,
) {
  return entries.filter((entry) => (entry.endDate ?? entry.date) >= today);
}

export function restaurantToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addEntryToMonth(
  months: Map<string, ISeasonalMonth>,
  entry: TSeasonalCard,
) {
  const key = entry.date.slice(0, 7);
  const day = new Date(`${entry.date}T12:00:00Z`);
  const month = months.get(key) ?? {
    key,
    name: new Intl.DateTimeFormat("en-IE", {
      month: "long",
      timeZone: "UTC",
    }).format(day),
    abbreviation: new Intl.DateTimeFormat("en-IE", {
      month: "short",
      timeZone: "UTC",
    }).format(day),
    events: [],
  };
  month.events.push({ ...entry, day: entry.date.slice(8, 10) });
  months.set(key, month);
}
