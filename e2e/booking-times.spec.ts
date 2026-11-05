import type { ITimesData, TBookingResponse } from "@/lib/types";

import {
  dayLabel,
  dublinToday,
  FAKE_RESDIARY,
  FAKE_TIMES,
  fullDates,
} from "./booking-fixtures";
import {
  chooseDate,
  chooseGuests,
  chooseTime,
  expectBookingAtTop,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

test("available times show three desktop rows or four mobile rows before Show more", async ({
  page,
}) => {
  await page.route("**/api/bookings/times?**", async (route) => {
    const response = await route.fetch();
    const reply: TBookingResponse<ITimesData> = await response.json();
    if (!reply.ok || !reply.data.times[0])
      throw new Error("Expected available booking times");
    const first = reply.data.times[0];
    await route.fulfill({
      response,
      json: {
        ...reply,
        data: {
          ...reply.data,
          times: Array.from({ length: 16 }, (_, index) => {
            const hour = String(9 + Math.floor(index / 4)).padStart(2, "0");
            const minute = String((index % 4) * 15).padStart(2, "0");
            return {
              ...first,
              time: `${hour}:${minute}`,
              label: `${hour}:${minute}`,
            };
          }),
        },
      },
    });
  });
  const panel = await openBooking(page);
  await chooseDate(panel, laterFreeDate());
  await findTable(panel);
  const slots = panel
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button");
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
  const initialCount = desktop ? 12 : 8;
  await expect(slots).toHaveCount(initialCount);
  await expectBookingAtTop(panel);
  const bounds = await slots.evaluateAll((buttons) =>
    buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
  );
  expect(new Set(bounds).size).toBe(desktop ? 3 : 4);
  const viewport = page.viewportSize();
  if (viewport && viewport.width >= 1024) {
    await slots.nth(11).click();
    await page.setViewportSize({ width: 390, height: viewport.height });
    await expect(slots).toHaveCount(16);
    await expect(slots.nth(11)).toHaveAttribute("aria-pressed", "true");
    await panel
      .getByRole("button", { name: "Show fewer times", exact: true })
      .click();
    await expect(slots).toHaveCount(8);
    await page.setViewportSize(viewport);
    await expect(slots).toHaveCount(12);
  }
  const more = panel.getByRole("button", {
    name: `Show more times (${16 - initialCount} more)`,
    exact: true,
  });
  const gridBounds = await panel
    .getByRole("group", { name: "Available times", exact: true })
    .boundingBox();
  const buttonBounds = await more.boundingBox();
  if (!gridBounds || !buttonBounds)
    throw new Error("Expected visible times and Show more button");
  expect(
    Math.abs(
      buttonBounds.x +
        buttonBounds.width / 2 -
        gridBounds.x -
        gridBounds.width / 2,
    ),
  ).toBeLessThanOrEqual(1);
  await more.scrollIntoViewIfNeeded();
  const collapsedPanelHeight = await panel.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  const position = await page.evaluate(() => window.scrollY);
  await more.click();
  await expect(slots).toHaveCount(16);
  const less = panel.getByRole("button", {
    name: "Show fewer times",
    exact: true,
  });
  await expect(less).toBeFocused();
  await expect(less).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await less.scrollIntoViewIfNeeded();
  const expandedPosition = await page.evaluate(() => window.scrollY);
  await less.click();
  await expect(slots).toHaveCount(initialCount);
  await expect(more).toBeFocused();
  await expect
    .poll(async () =>
      Math.abs(
        (await panel.evaluate(
          (element) => element.getBoundingClientRect().height,
        )) - collapsedPanelHeight,
      ),
    )
    .toBeLessThanOrEqual(1);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(expandedPosition);
  await page.keyboard.press("Space");
  await expect(slots).toHaveCount(16);
  await slots.nth(initialCount).click();
  await expect(slots.nth(initialCount)).toHaveAttribute("aria-pressed", "true");
  await less.click();
  await expect(slots).toHaveCount(initialCount);
  await page.keyboard.press("Space");
  await expect(slots).toHaveCount(16);
  await expect(slots.nth(initialCount)).toHaveAttribute("aria-pressed", "true");
});

test("while times load the page says so, then lists ResDiary's times", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseGuests(reservations, FAKE_RESDIARY.slowPartySize);
  await chooseDate(reservations, laterFreeDate(FAKE_RESDIARY.slowPartySize));
  await findTable(reservations);

  await expect(
    reservations.getByRole("status").getByText("Finding tables…"),
  ).toBeVisible();
  await expect(
    reservations.locator('[data-booking-skeleton="times"]'),
  ).toBeVisible();
  await expect(
    reservations
      .getByRole("group", { name: "Available times", exact: true })
      .getByRole("button"),
  ).toHaveText(
    FAKE_TIMES.map((slot) => slot.label),
    { timeout: 10_000 },
  );
  await expect(reservations.getByText("Finding tables…")).toBeHidden();
  await expect(
    reservations.locator('[data-booking-skeleton="times"]'),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: /^Show more times/ }),
  ).toHaveCount(0);
});

test("a failed times search shows the server's message with phone and email", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseGuests(reservations, FAKE_RESDIARY.failingPartySize);
  await chooseDate(reservations, laterFreeDate(FAKE_RESDIARY.defaultPartySize));
  await findTable(reservations);

  await expect(
    reservations.getByText(
      "Online booking isn't available right now. Please call us on +353 1 676 3144 or email reception@peploes.com.",
      { exact: true },
    ),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    reservations.getByRole("group", { name: "Available times", exact: true }),
  ).toHaveCount(0);
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await reservations
    .getByRole("button", { name: "Back to search", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});

test("a day with no tables online says so and offers the phone", async ({
  page,
}) => {
  const fullForTwo = fullDates(
    dublinToday(),
    FAKE_RESDIARY.firstDaysFullPartySize,
  )[1];
  if (!fullForTwo) throw new Error("The fake ResDiary needs a full day.");

  const reservations = await openBooking(page);
  await chooseDate(reservations, fullForTwo);
  await chooseGuests(reservations, FAKE_RESDIARY.firstDaysFullPartySize);
  await findTable(reservations);

  await expect(
    reservations.getByText(
      `There are no tables for ${FAKE_RESDIARY.firstDaysFullPartySize} guests online on ${dayLabel(fullForTwo)}. Please choose another day, or call us on +353 1 676 3144.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
});

test("a required return time must be accepted, an optional one is shown", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate(FAKE_RESDIARY.defaultPartySize));
  await findTable(reservations);
  const times = reservations.getByRole("group", {
    name: "Available times",
    exact: true,
  });
  const next = reservations.getByRole("button", {
    name: "Continue",
    exact: true,
  });

  await times.getByRole("button", { name: "6:00 pm", exact: true }).click();
  await expect(
    reservations.getByText("Table until 8:00 pm", { exact: true }),
  ).toBeVisible();
  await expect(next).toBeEnabled();

  await chooseTime(reservations, "7:00 pm");
  await expect(next).toBeDisabled();
  await reservations
    .getByLabel("I understand the table is required back by 9:00 pm")
    .check();
  await expect(next).toBeEnabled();
  await times.getByRole("button", { name: "6:00 pm", exact: true }).click();
  await chooseTime(reservations, "7:00 pm");
  await expect(
    reservations.getByLabel(
      "I understand the table is required back by 9:00 pm",
    ),
  ).not.toBeChecked();
  await expect(next).toBeDisabled();
});

test("changing between required return deadlines needs a new acceptance", async ({
  page,
}) => {
  await page.route("**/api/bookings/times?**", async (route) => {
    const response = await route.fetch();
    const body: TBookingResponse<ITimesData> = await response.json();
    expect(body.ok).toBe(true);
    if (body.ok) {
      const offer = body.data.times.find((slot) => slot.time === "18:00")
        ?.offers[0];
      expect(offer?.returnBy).toBeDefined();
      if (offer?.returnBy) offer.returnBy.required = true;
    }
    await route.fulfill({ response, json: body });
  });
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "6:00 pm", exact: true })
    .click();
  await reservations
    .getByLabel("I understand the table is required back by 8:00 pm")
    .check();
  await chooseTime(reservations, "7:00 pm");
  await expect(
    reservations.getByLabel(
      "I understand the table is required back by 9:00 pm",
    ),
  ).not.toBeChecked();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
});

test("returning from an optional-return hold requires accepting a new deadline", async ({
  page,
}) => {
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "6:00 pm", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible();
  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await chooseTime(reservations, "7:00 pm");
  await expect(
    reservations.getByLabel(
      "I understand the table is required back by 9:00 pm",
    ),
  ).not.toBeChecked();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
});

test("a slow, older times search never replaces the newer one", async ({
  page,
}) => {
  const [date] = fullDates(dublinToday(), FAKE_RESDIARY.slowPartySize);
  if (!date) throw new Error("The fake ResDiary needs a full day.");

  const reservations = await openBooking(page);
  await chooseDate(reservations, date);
  await chooseGuests(reservations, FAKE_RESDIARY.slowPartySize);
  const slowReply = page.waitForResponse(
    (response) =>
      response.url().includes("/api/bookings/times") &&
      response.url().includes(`partySize=${FAKE_RESDIARY.slowPartySize}`),
  );
  await findTable(reservations);
  await reservations
    .getByRole("button", { name: "Back to search", exact: true })
    .click();
  await chooseGuests(reservations, 3);
  await findTable(reservations);
  const expectedTimes = FAKE_TIMES.map((slot) => slot.label);
  const times = reservations
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button");
  await expect(times).toHaveText(expectedTimes);

  await slowReply;
  await page.waitForTimeout(500);
  await expect(times).toHaveText(expectedTimes);
  await expect(reservations.getByText(/There are no tables/)).toHaveCount(0);
});
