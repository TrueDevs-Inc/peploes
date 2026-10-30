import type { Page } from "@playwright/test";

import {
  addDays,
  closedPeriod,
  dublinToday,
  FAKE_RESDIARY,
  freeDates,
  fullDates,
  isOpen,
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
  await expect(picker.day(fullWhenLoaded)).toBeEnabled();
  await expect(checking).toBeHidden({ timeout: 10_000 });
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

test("a fully booked default date moves to the first free day", async ({
  page,
}) => {
  const today = dublinToday();
  const [firstFree] = freeDates(today, FAKE_RESDIARY.firstDaysFullPartySize);
  if (!firstFree) throw new Error("The fake ResDiary needs a free day.");

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await reservations.getByRole("combobox", { name: "Party size" }).click();
  await reservations
    .getByRole("option", {
      name: `${FAKE_RESDIARY.firstDaysFullPartySize} guests`,
    })
    .click();

  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(firstFree)}`);
});

test("a date the guest chose stays when it becomes fully booked, with a note", async ({
  page,
}) => {
  const today = dublinToday();
  const chosen = fullDates(today, FAKE_RESDIARY.firstDaysFullPartySize)[1];
  if (!chosen) throw new Error("The fake ResDiary needs a full day.");

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseDate(reservations, chosen);
  await reservations.getByRole("combobox", { name: "Party size" }).click();
  await reservations
    .getByRole("option", {
      name: `${FAKE_RESDIARY.firstDaysFullPartySize} guests`,
    })
    .click();

  await expect(
    reservations.getByText(
      `No tables for ${FAKE_RESDIARY.firstDaysFullPartySize} guests on ${shortDayLabel(chosen)}. Please choose another day.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(chosen)}`);
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

test("a refreshed full default date moves to the first free day", async ({
  page,
}) => {
  await page.clock.install();
  const [date, nextFree] = openDates(dublinToday());
  if (!(date && nextFree))
    throw new Error("The fake ResDiary needs two open days.");
  const replies = await mockCalendar(page, []);
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const picker = bookingCalendar(reservations);
  await picker.open();
  await expect(picker.calendar.getByRole("status")).toHaveText("");
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(date)}`);
  await replies.settle();
  await picker.close();
  replies.full = [date];
  await page.clock.fastForward("02:01");
  await picker.open();
  await expect(
    reservations.getByRole("button", { name: /^Date / }),
  ).toHaveAccessibleName(`Date ${shortDayLabel(nextFree)}`);
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
