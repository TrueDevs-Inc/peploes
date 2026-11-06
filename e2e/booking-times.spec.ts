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
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./booking-test";

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
    reservations
      .getByRole("group", { name: "Available times", exact: true })
      .getByRole("button"),
  ).toHaveText(
    FAKE_TIMES.map((slot) => slot.label),
    { timeout: 10_000 },
  );
  await expect(reservations.getByText("Finding tables…")).toBeHidden();
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

  await times.getByRole("button", { name: "7:00 pm", exact: true }).click();
  await expect(next).toBeDisabled();
  await reservations
    .getByLabel("I understand the table is required back by 9:00 pm")
    .check();
  await expect(next).toBeEnabled();
  await times.getByRole("button", { name: "6:00 pm", exact: true }).click();
  await times.getByRole("button", { name: "7:00 pm", exact: true }).click();
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
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
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
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
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
  const times = reservations
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button");
  await expect(times).toHaveText(FAKE_TIMES.map((slot) => slot.label));

  await slowReply;
  await page.waitForTimeout(500);
  await expect(times).toHaveText(FAKE_TIMES.map((slot) => slot.label));
  await expect(reservations.getByText(/There are no tables/)).toHaveCount(0);
});
