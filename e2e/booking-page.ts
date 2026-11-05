import { expect, type Locator, type Page } from "@playwright/test";

import {
  dayLabel,
  dublinToday,
  FAKE_RESDIARY,
  freeDates,
  monthLabel,
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

export async function expectBookingAtTop(reservations: Locator) {
  await expect
    .poll(() =>
      reservations.evaluate((element) =>
        Math.abs(
          element.getBoundingClientRect().top -
            (document.querySelector("header")?.getBoundingClientRect().bottom ??
              0) -
            8,
        ),
      ),
    )
    .toBeLessThanOrEqual(1);
}

export async function chooseTime(reservations: Locator, name: string) {
  const times = reservations.getByRole("group", {
    name: "Available times",
    exact: true,
  });
  await expect(times).toBeVisible();
  const slot = times.getByRole("button", { name, exact: true });
  const more = reservations.getByRole("button", { name: /^Show more times/ });
  if ((await more.isVisible()) && !(await slot.isVisible())) await more.click();
  await slot.click();
}
