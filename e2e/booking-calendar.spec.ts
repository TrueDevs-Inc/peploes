import type { Page } from "@playwright/test";

import {
  addDays,
  closedPeriod,
  dublinToday,
  FAKE_RESDIARY,
  freeDates,
  fullDates,
  isOpen,
  monthLabel,
  openDates,
  shortDayLabel,
  weekdayName,
} from "./booking-fixtures";
import {
  bookingCalendar,
  chooseDate,
  chooseGuests,
  findTable,
  laterFreeDate,
} from "./booking-page";
import { expect, test } from "./menu-test";

test("the date picker opens on the first open day and offers only the days ResDiary allows", async ({
  page,
}) => {
  const today = dublinToday();
  const open = openDates(today);
  const lastDate = addDays(today, FAKE_RESDIARY.daysAhead);
  const nextClosedWeekday = [1, 2, 3, 4, 5, 6, 7]
    .map((offset) => addDays(today, offset))
    .find((date) => weekdayName(date) === FAKE_RESDIARY.closedWeekday);
  const holiday = closedPeriod(today);
  const afterHoliday = open.find((date) => date > holiday.to);
  if (!(open[0] && nextClosedWeekday && afterHoliday)) {
    throw new Error("The fake ResDiary calendar needs open and closed days.");
  }

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const dateField = reservations.getByRole("button", { name: /^Date / });
  await expect(dateField).toHaveAccessibleName(
    `Date ${shortDayLabel(open[0])}`,
  );

  const picker = bookingCalendar(reservations);
  await picker.open();
  await expect(picker.previous).toBeDisabled();
  await picker.showMonth(nextClosedWeekday);
  await expect(picker.day(nextClosedWeekday)).toBeDisabled();
  await picker.showMonth(holiday.from);
  await expect(picker.day(holiday.from)).toBeDisabled();
  await picker.showMonth(holiday.to);
  await expect(picker.day(holiday.to)).toBeDisabled();
  await picker.showMonth(afterHoliday);
  await picker.day(afterHoliday).click();

  await expect(picker.calendar).toBeHidden();
  await expect(dateField).toHaveAccessibleName(
    `Date ${shortDayLabel(afterHoliday)}`,
  );

  await picker.open();
  await picker.showMonth(lastDate);
  await expect(picker.next).toBeDisabled();
  await expect(picker.next).toBeFocused();
  if (isOpen(lastDate, today)) {
    await expect(picker.day(lastDate)).toBeEnabled();
  } else {
    await expect(picker.day(lastDate)).toBeDisabled();
  }
});

test("Escape closes the date picker while focus stays on its trigger", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const trigger = reservations.getByRole("button", { name: /^Date / });
  const picker = bookingCalendar(reservations);
  await trigger.click();
  await expect(picker.calendar).toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.press("Escape");
  await expect(picker.calendar).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("booking calendar keeps one day tab stop and supports day, week and month keys", async ({
  page,
}) => {
  const today = dublinToday();
  const free = freeDates(today, FAKE_RESDIARY.defaultPartySize);
  const anchor = free.find((date) =>
    [-1, 1, 7].every((offset) => free.includes(addDays(date, offset))),
  );
  if (!anchor) throw new Error("Calendar fixture needs adjacent free days");
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await picker.open();
  await picker.showMonth(anchor);
  await expect(picker.day(anchor)).toBeEnabled();
  await expect(
    picker.calendar.locator('button[data-date][tabindex="0"]'),
  ).toHaveCount(1);
  await picker.day(anchor).focus();
  await page.keyboard.press("ArrowRight");
  await expect(picker.day(addDays(anchor, 1))).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(picker.day(anchor)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(picker.day(addDays(anchor, 7))).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(picker.day(anchor)).toBeFocused();
  const weekday = new Date(`${anchor}T12:00:00Z`).getUTCDay();
  const monday = addDays(anchor, -((weekday + 6) % 7));
  const sunday = addDays(monday, 6);
  const week = free.filter((date) => date >= monday && date <= sunday);
  await page.keyboard.press("Home");
  await expect(picker.day(week[0] ?? "")).toBeFocused();
  await page.keyboard.press("End");
  await expect(picker.day(week.at(-1) ?? "")).toBeFocused();
  await page.reload();
  await picker.open();
  await picker.day(free[0] ?? "").focus();
  await page.keyboard.press("PageUp");
  await expect(picker.day(free[0] ?? "")).toBeFocused();
  const next = new Date(`${free[0]}T12:00:00Z`);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  const nextDate = next.toISOString().slice(0, 10);
  const nextFree = free.find((date) => date >= nextDate);
  if (!nextFree)
    throw new Error("Calendar fixture needs next-month availability");
  await page.keyboard.press("PageDown");
  await expect(picker.day(nextFree)).toBeFocused();
  await expect(
    picker.calendar.locator('button[data-date][tabindex="0"]'),
  ).toHaveCount(1);
  await page.keyboard.press("PageUp");
  await expect(picker.calendar.locator("strong")).toHaveText(
    monthLabel(free[0] ?? ""),
  );
  await page.keyboard.press("Escape");
  await expect(picker.calendar).toBeHidden();
});

test("party size offers ResDiary's online range and starts on its default", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const partySize = reservations.getByRole("combobox", { name: "Party size" });

  await expect(partySize).toHaveText("4 guests");
  await partySize.click();
  await expect(
    reservations
      .getByRole("listbox", { name: "Party size" })
      .getByRole("option"),
  ).toHaveText([
    "1 guest",
    "2 guests",
    "3 guests",
    "4 guests",
    "5 guests",
    "6 guests",
  ]);
});

test("fully booked days are greyed out in this month and later months", async ({
  page,
}) => {
  const today = dublinToday();
  const [firstFull, secondFull, laterFull] = fullDates(
    today,
    FAKE_RESDIARY.defaultPartySize,
  );
  const freeBetween = freeDates(today, FAKE_RESDIARY.defaultPartySize).find(
    (date) => firstFull && secondFull && date > firstFull && date < secondFull,
  );
  if (!(firstFull && secondFull && laterFull && freeBetween)) {
    throw new Error("The fake ResDiary needs full and free days.");
  }

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await picker.open();

  await picker.showMonth(firstFull);
  await expect(picker.day(firstFull)).toBeDisabled();
  await picker.showMonth(freeBetween);
  await expect(picker.day(freeBetween)).toBeEnabled();
  await picker.showMonth(secondFull);
  await expect(picker.day(secondFull)).toBeDisabled();
  await picker.showMonth(laterFull);
  await expect(picker.day(laterFull)).toBeDisabled();
});

test("changing party size shows that size's full days, even when the older reply arrives last", async ({
  page,
}) => {
  const today = dublinToday();
  const [freeForThree] = fullDates(today, FAKE_RESDIARY.slowPartySize);
  const [fullForThree] = fullDates(today, 3);
  if (!(freeForThree && fullForThree)) {
    throw new Error("The fake ResDiary needs full days for both sizes.");
  }

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const partySize = reservations.getByRole("combobox", { name: "Party size" });
  const slowReply = page.waitForResponse((response) =>
    response.url().includes(`partySize=${FAKE_RESDIARY.slowPartySize}`),
  );
  await partySize.click();
  await reservations
    .getByRole("option", { name: `${FAKE_RESDIARY.slowPartySize} guests` })
    .click();
  await partySize.click();
  await reservations.getByRole("option", { name: "3 guests" }).click();
  await slowReply;
  await page.waitForTimeout(500);

  const picker = bookingCalendar(reservations);
  await picker.open();
  await picker.showMonth(freeForThree);
  await expect(picker.day(freeForThree)).toBeEnabled();
  await picker.showMonth(fullForThree);
  await expect(picker.day(fullForThree)).toBeDisabled();
});

test("the calendar stays usable while availability loads and when it fails", async ({
  page,
}) => {
  const today = dublinToday();
  const [fullWhenLoaded] = fullDates(today, FAKE_RESDIARY.slowPartySize);
  const [usuallyFull] = fullDates(today, FAKE_RESDIARY.defaultPartySize);
  if (!(fullWhenLoaded && usuallyFull)) {
    throw new Error("The fake ResDiary needs full days.");
  }

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const partySize = reservations.getByRole("combobox", { name: "Party size" });
  const picker = bookingCalendar(reservations);
  const checking = picker.calendar
    .getByRole("status")
    .getByText("Checking which days are full…");

  await partySize.click();
  await reservations
    .getByRole("option", { name: `${FAKE_RESDIARY.slowPartySize} guests` })
    .click();
  await picker.open();
  await picker.showMonth(fullWhenLoaded);
  await expect(checking).toBeVisible();
  await expect(
    picker.calendar.locator('[data-booking-skeleton="calendar"]'),
  ).toBeVisible();
  await expect(picker.day(fullWhenLoaded)).toBeEnabled();
  await expect(checking).toBeHidden({ timeout: 10_000 });
  await expect(
    picker.calendar.locator('[data-booking-skeleton="calendar"]'),
  ).toBeHidden();
  await expect(picker.day(fullWhenLoaded)).toBeDisabled();
  await picker.close();
  await expect(picker.calendar).toBeHidden();

  const failures: number[] = [];
  page.on("response", (response) => {
    if (response.url().includes(`partySize=${FAKE_RESDIARY.failingPartySize}`))
      failures.push(response.status());
  });
  await partySize.click();
  await reservations
    .getByRole("option", { name: `${FAKE_RESDIARY.failingPartySize} guests` })
    .click();
  await expect.poll(() => failures, { timeout: 10_000 }).toEqual([503, 503]);
  await picker.open();
  await expect(checking).toBeHidden({ timeout: 10_000 });
  await picker.showMonth(usuallyFull);
  await picker.day(usuallyFull).click();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(usuallyFull)}`);
});

test("a fully booked default date moves to the first free day in the next month", async ({
  page,
}) => {
  const replies = await mockMonthEndCalendar(page);
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });

  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.firstFree)}`);
  const picker = bookingCalendar(reservations);
  await picker.open();
  await expect(picker.calendar.locator("strong")).toHaveText(
    monthLabel(replies.firstFree),
  );
  await expect(picker.day(replies.firstFree)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await picker.previous.click();
  const browsedMonth = await picker.calendar.locator("strong").textContent();
  await picker.close();
  await picker.open();
  await expect(picker.calendar.locator("strong")).toHaveText(
    browsedMonth ?? "",
  );
  await picker.next.click();
  await picker.day(replies.firstFree).click();
  await expect(picker.calendar).toBeHidden();
});

test("a full default date waits for next month's availability before moving", async ({
  page,
}) => {
  const replies = await mockMonthEndCalendar(page);
  replies.pauseNext = true;
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const dateField = reservations.getByRole("button", { name: /^Date / });

  await expect.poll(() => replies.pending.length).toBe(1);
  await expect(reservations.getByText(/^No tables for/)).toBeVisible();
  await expect(dateField).toHaveAccessibleName(
    `Date ${shortDayLabel(replies.date)}`,
  );
  await replies.release();
  await expect(dateField).toHaveAccessibleName(
    `Date ${shortDayLabel(replies.firstFree)}`,
  );
});

test("a full default date stays with a note when neither month has a free day", async ({
  page,
}) => {
  const replies = await mockMonthEndCalendar(page);
  replies.empty = true;
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });

  await expect.poll(() => replies.answered.length).toBe(2);
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.date)}`);
  await expect(
    reservations.getByText(
      `No tables for ${FAKE_RESDIARY.defaultPartySize} guests on ${shortDayLabel(replies.date)}. Please choose another day.`,
      { exact: true },
    ),
  ).toBeVisible();
});

test("a date the guest chose stays when it becomes fully booked, with a note", async ({
  page,
}) => {
  const replies = await mockMonthEndCalendar(page);
  replies.full = false;
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await expect.poll(() => replies.answered.length).toBe(2);
  await chooseDate(reservations, replies.date);
  replies.full = true;
  await chooseGuests(reservations, FAKE_RESDIARY.firstDaysFullPartySize);
  await expect.poll(() => replies.answered.length).toBe(4);

  await expect(
    reservations.getByText(
      `No tables for ${FAKE_RESDIARY.firstDaysFullPartySize} guests on ${shortDayLabel(replies.date)}. Please choose another day.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.date)}`);
});

test("a calendar reply during the times step moves the default date only on returning to search", async ({
  page,
}) => {
  const replies = await mockMonthEndCalendar(page);
  replies.pauseNext = true;
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await expect.poll(() => replies.pending.length).toBe(1);
  await expect(reservations.getByText(/^No tables for/)).toBeVisible();
  await findTable(reservations);
  await expect(
    reservations.getByRole("heading", { name: "Available times", exact: true }),
  ).toBeVisible();
  await replies.release();
  await expect(
    reservations.getByText(shortDayLabel(replies.date), { exact: false }),
  ).toBeVisible();
  await reservations
    .getByRole("button", { name: "Back to search", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.firstFree)}`);
});

for (const returnTo of ["picker", "search", "month"]) {
  test(`stale full days refresh on returning to the ${returnTo}, keeping known days during the request`, async ({
    page,
  }) => {
    await page.clock.install();
    const date = laterFreeDate();
    const replies = await mockCalendar(page, [date]);
    await page.goto("/book-a-table");
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    const picker = bookingCalendar(reservations);
    await picker.open();
    await picker.showMonth(date);
    await expect(picker.day(date)).toBeDisabled();
    const startsThisMonth = date.slice(0, 7) === dublinToday().slice(0, 7);
    if (returnTo === "month") {
      await (startsThisMonth ? picker.next : picker.previous).click();
    } else {
      await picker.close();
    }
    if (returnTo === "search") {
      await findTable(reservations);
      await expect(
        reservations.getByRole("heading", {
          name: "Available times",
          exact: true,
        }),
      ).toBeVisible();
    }
    await replies.settle();
    const before = replies.requests.length;
    replies.full = [];
    replies.pause = true;
    await page.clock.fastForward("02:01");
    if (returnTo === "search") {
      await reservations
        .getByRole("button", { name: "Back to search", exact: true })
        .click();
      await expect.poll(() => replies.requests.length).toBeGreaterThan(before);
      await picker.open();
      await picker.showMonth(date);
    } else if (returnTo === "month") {
      await (startsThisMonth ? picker.previous : picker.next).click();
    } else {
      await picker.open();
    }
    await expect.poll(() => replies.pending.length).toBeGreaterThan(0);
    await expect(picker.day(date)).toBeDisabled();
    await expect(picker.calendar.getByRole("status")).toHaveText("");
    const refreshing = replies.requests.length;
    await picker.close();
    await picker.open();
    await replies.settle();
    await expect(picker.day(date)).toBeDisabled();
    expect(replies.requests).toHaveLength(refreshing);
    await replies.release();
    await expect(picker.day(date)).toBeEnabled();
    await picker.day(date).click();
    await expect(
      reservations.getByRole("button", { name: /^Date / }),
    ).toHaveAccessibleName(`Date ${shortDayLabel(date)}`);
  });
}

test("reopening a fresh calendar sends no new request", async ({ page }) => {
  await page.clock.install();
  const date = laterFreeDate();
  const replies = await mockCalendar(page, [date]);
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await picker.open();
  await picker.showMonth(date);
  await expect(picker.day(date)).toBeDisabled();
  await replies.settle();
  const before = replies.requests.length;
  await picker.close();
  await page.clock.fastForward("01:00");
  await picker.open();
  await replies.settle();
  await expect(picker.day(date)).toBeDisabled();
  expect(replies.requests).toHaveLength(before);
});

test("a failed calendar retries on reopening without waiting for freshness", async ({
  page,
}) => {
  const date = laterFreeDate();
  const replies = await mockCalendar(page, [date]);
  replies.fail = true;
  replies.pause = true;
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await picker.open();
  await picker.showMonth(date);
  await expect(picker.calendar.getByRole("status")).toHaveText(
    "Checking which days are full…",
  );
  await replies.release();
  await expect(picker.calendar.getByRole("status")).toHaveText("");
  await expect(picker.day(date)).toBeEnabled();
  await picker.close();
  const failedRequests = [...replies.requests];
  replies.fail = false;
  await picker.open();
  await expect(picker.day(date)).toBeDisabled();
  await replies.settle();
  const retried = replies.requests.slice(failedRequests.length);
  expect(retried.length).toBeGreaterThan(0);
  expect(new Set(retried).size).toBe(retried.length);
  for (const url of retried) expect(failedRequests).toContain(url);
});

test("a late refresh for the previous party size does not change the current calendar", async ({
  page,
}) => {
  await page.clock.install();
  const date = laterFreeDate();
  const replies = await mockCalendar(page, []);
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseDate(reservations, date);
  await replies.settle();
  const picker = bookingCalendar(reservations);
  replies.full = [date];
  replies.pause = true;
  await page.clock.fastForward("02:01");
  await picker.open();
  await expect.poll(() => replies.pending.length).toBeGreaterThan(0);
  await picker.close();
  replies.full = [];
  replies.pause = false;
  await chooseGuests(reservations, 3);
  await picker.open();
  await picker.showMonth(date);
  await expect(picker.calendar.getByRole("status")).toHaveText("");
  await replies.release();
  await expect(picker.day(date)).toBeEnabled();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(date)}`);
  await expect(reservations.getByText(/^No tables for/)).toHaveCount(0);
});

test("a refresh keeps the guest's chosen date and updates its full-day note", async ({
  page,
}) => {
  await page.clock.install();
  const date = laterFreeDate();
  const replies = await mockCalendar(page, []);
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseDate(reservations, date);
  await replies.settle();
  const picker = bookingCalendar(reservations);
  replies.full = [date];
  await page.clock.fastForward("02:01");
  await picker.open();
  await expect(picker.day(date)).toBeDisabled();
  const note = reservations.getByText(
    `No tables for ${FAKE_RESDIARY.defaultPartySize} guests on ${shortDayLabel(date)}. Please choose another day.`,
    { exact: true },
  );
  await expect(note).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(date)}`);
  await picker.close();
  replies.full = [];
  await page.clock.fastForward("02:01");
  await picker.open();
  await expect(picker.day(date)).toBeEnabled();
  await expect(note).toBeHidden();
});

test("a refreshed full default date moves to the next month and shows its selected day", async ({
  page,
}) => {
  await page.clock.install();
  const replies = await mockMonthEndCalendar(page);
  replies.full = false;
  await replies.open();
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await expect.poll(() => replies.answered.length).toBe(2);
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.date)}`);
  replies.full = true;
  await page.clock.fastForward("02:01");
  await picker.open();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(replies.firstFree)}`);
  await picker.close();
  await picker.open();
  await expect(picker.calendar.locator("strong")).toHaveText(
    monthLabel(replies.firstFree),
  );
  await expect(picker.day(replies.firstFree)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

async function mockCalendar(page: Page, full: string[]) {
  const requests: string[] = [];
  const pending: (() => Promise<void>)[] = [];
  const responses: Promise<void>[] = [];
  const replies = {
    full,
    fail: false,
    pause: false,
    requests,
    pending,
    async release() {
      replies.pause = false;
      await Promise.all(replies.pending.splice(0).map((send) => send()));
      await replies.settle();
    },
    async settle() {
      await expect
        .poll(() => replies.requests.length)
        .toBeGreaterThanOrEqual(2);
      await Promise.all(responses);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
    },
  };
  await page.route("**/api/bookings/calendar?**", async (route) => {
    const url = new URL(route.request().url());
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const dates = openDates(dublinToday()).filter(
      (date) => date >= from && date <= to && !replies.full.includes(date),
    );
    replies.requests.push(url.href);
    const response = replies.fail
      ? {
          status: 503,
          json: { ok: false, error: { message: "Calendar unavailable" } },
        }
      : {
          json: {
            ok: true,
            data: {
              from,
              to,
              partySize: Number(url.searchParams.get("partySize")),
              openDates: dates,
            },
          },
        };
    const send = () => {
      const received = page.waitForResponse(url.href);
      const finished = route.fulfill(response).then(async () => {
        await (await received).finished();
      });
      responses.push(finished);
      return finished;
    };
    if (replies.pause) {
      replies.pending.push(send);
      return;
    }
    await send();
  });
  return replies;
}

async function monthEndScenario(page: Page) {
  const value = await page
    .getByRole("button", { name: /^Date / })
    .textContent();
  if (!value) throw new Error("The booking page needs a default date.");
  const date = new Date(`${value} GMT`).toISOString().slice(0, 10);
  const start = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
  const nextStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const nextMonth = nextStart.toISOString().slice(0, 7);
  const lastDay = addDays(nextStart.toISOString().slice(0, 10), -1);
  const gridEnd = addDays(lastDay, (7 - new Date(lastDay).getUTCDay()) % 7);
  const firstFree = openDates(date).find(
    (day) =>
      day.slice(0, 7) === nextMonth &&
      day > gridEnd &&
      isOpen(day, addDays(date, -1)),
  );
  if (!firstFree)
    throw new Error(
      "The fake ResDiary needs a free day beyond the current grid.",
    );
  return { date, firstFree, nextMonth };
}

async function mockMonthEndCalendar(page: Page) {
  let scenario: ReturnType<typeof monthEndScenario> | undefined;
  const pending: (() => Promise<void>)[] = [];
  const answered: string[] = [];
  const replies = {
    date: "",
    firstFree: "",
    full: true,
    empty: false,
    pauseNext: false,
    pending,
    answered,
    async open() {
      await page.goto("/book-a-table");
      await expect.poll(() => replies.firstFree).not.toBe("");
    },
    async release() {
      replies.pauseNext = false;
      await Promise.all(pending.splice(0).map((send) => send()));
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
    },
  };
  await page.route("**/api/bookings/calendar?**", async (route) => {
    scenario ??= monthEndScenario(page);
    const { date, firstFree, nextMonth } = await scenario;
    replies.date = date;
    replies.firstFree = firstFree;
    const url = new URL(route.request().url());
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const isNext = addDays(from, 14).slice(0, 7) === nextMonth;
    const dates = replies.full
      ? [firstFree].filter(() => isNext && !replies.empty)
      : [date, firstFree];
    const send = async () => {
      const received = page.waitForResponse(url.href);
      await route.fulfill({
        json: {
          ok: true,
          data: {
            from,
            to,
            partySize: Number(url.searchParams.get("partySize")),
            openDates: dates.filter((day) => day >= from && day <= to),
          },
        },
      });
      await (await received).finished();
      answered.push(url.href);
    };
    if (isNext && replies.pauseNext) {
      pending.push(send);
      return;
    }
    await send();
  });
  return replies;
}
