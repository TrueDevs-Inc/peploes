import { expect, type Locator, type Page } from "@playwright/test";

import type { TPaymentStep } from "../src/lib/types";

import {
  dayLabel,
  dublinToday,
  FAKE_RESDIARY,
  freeDates,
  monthLabel,
  shortDayLabel,
} from "./booking-fixtures";

export function bookingCalendar(reservations: Locator) {
  const calendar = reservations.getByRole("group", { name: "Choose date" });
  const heading = calendar.locator("strong");
  const next = calendar.getByRole("button", { name: "Next month" });
  const field = reservations.getByRole("button", { name: /^Date / });

  return {
    calendar,
    next,
    previous: calendar.getByRole("button", { name: "Previous month" }),
    open: () => field.click(),
    close: () => field.click(),
    day: (date: string) =>
      calendar.getByRole("button", { name: dayLabel(date), exact: true }),
    async showMonth(date: string) {
      while ((await heading.textContent()) !== monthLabel(date)) {
        const shown = (await heading.textContent()) ?? "";
        await next.click();
        await expect(heading).not.toHaveText(shown);
      }
    },
  };
}

export async function chooseDate(reservations: Locator, date: string) {
  const picker = bookingCalendar(reservations);
  await picker.open();
  await picker.showMonth(date);
  await picker.day(date).click();
}

export function laterFreeDate(
  partySize: number = FAKE_RESDIARY.defaultPartySize,
): string {
  const today = dublinToday();
  return freeDates(today, partySize).find((date) => date > today) ?? "";
}

export async function openBooking(page: Page) {
  await page.goto("/book-a-table");
  return page.getByRole("region", { name: "Table reservations" });
}

export async function chooseGuests(reservations: Locator, partySize: number) {
  await reservations.getByRole("combobox", { name: "Party size" }).click();
  await reservations
    .getByRole("option", {
      name: partySize === 1 ? "1 guest" : `${partySize} guests`,
      exact: true,
    })
    .click();
}

export function findTable(reservations: Locator) {
  return reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
}

export async function restorePaymentStep(
  page: Page,
  kind: "payment" | "card" = "payment",
) {
  const reservations = await openBooking(page);
  await page.route("**/api/bookings/hold-status?**", (route) =>
    route.fulfill({ json: { ok: true, data: { status: "pending" } } }),
  );
  const date = laterFreeDate();
  await page.evaluate(
    ({ date, dateLabel, kind }) => {
      sessionStorage.setItem(
        "peploes:booking-payment",
        JSON.stringify({
          kind,
          amountCents: 2000,
          amountText: "€20.00",
          stripe: {
            publishableKey: "pk_test_e2e",
            accountId: "acct_e2e",
            clientSecret:
              kind === "card"
                ? "seti_saved_secret_saved"
                : "pi_saved_secret_saved",
          },
          summary: {
            reference: "E2E99999",
            revision: 1,
            date,
            dateLabel,
            time: "18:00",
            timeLabel: "6:00 pm",
            partySize: 4,
            guestsLabel: "4 guests",
            offer: {
              kind: "standard",
              feeCents: 2000,
              mayRequireCard: false,
              returnBy: null,
            },
          },
        } satisfies TPaymentStep),
      );
    },
    { date, dateLabel: shortDayLabel(date), kind },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  return reservations;
}
