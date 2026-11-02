// biome-ignore-all lint/style/useNamingConvention: ResDiary's API uses PascalCase field names.
import { expect, type Locator, type Page, test } from "@playwright/test";
import { addDays, dublinToday } from "./booking-fixtures";
import { bookingCalendar, chooseDate, chooseGuests } from "./booking-page";

const DAY_LABEL = /^[A-Z][a-z]+day, \d{1,2} [A-Z][a-z]+ \d{4}$/;

function isoDate(label: string): string {
  const day = new Date(label.split(", ")[1] ?? "");
  const month = String(day.getMonth() + 1).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, "0")}`;
}

async function shownDays(calendar: Locator) {
  const days = [];
  for (const button of await calendar.locator("button[aria-label]").all()) {
    const label = (await button.getAttribute("aria-label")) ?? "";
    if (DAY_LABEL.test(label)) {
      days.push({ date: isoDate(label), enabled: await button.isEnabled() });
    }
  }
  return days;
}

function clockLabel(time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const suffix = hours < 12 ? "am" : "pm";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

let token: Promise<string> | null = null;
const base = () => (process.env.RESDIARY_API_URL ?? "").replace(/\/+$/, "");
const restaurantPath = () =>
  `/api/ConsumerApi/v1/Restaurant/${encodeURIComponent(process.env.RESDIARY_MICROSITE_NAME ?? "")}`;

async function resDiary(
  method: string,
  path: string,
  body?: object,
  signal?: AbortSignal,
): Promise<unknown> {
  token ??= fetch(`${base()}/api/Jwt/v2/Authenticate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      Username: process.env.RESDIARY_USERNAME,
      Password: process.env.RESDIARY_PASSWORD,
    }),
    signal,
  })
    .then((reply) => reply.json())
    .then((reply) => (reply as { Token: string }).Token);
  const reply = await fetch(`${base()}${restaurantPath()}/${path}`, {
    method,
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${await token}`,
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!reply.ok) {
    throw new Error(
      `Sandbox ${method} ${path.split("?")[0]} returned HTTP ${reply.status}`,
    );
  }
  const text = await reply.text();
  return text ? JSON.parse(text) : null;
}

function sandbox(endpoint: string, body: object): Promise<unknown> {
  return resDiary("POST", endpoint, {
    ...body,
    ChannelCode: process.env.RESDIARY_CHANNEL_CODE,
    AvailabilityType: "Reservation",
  });
}

async function sandboxBooking(
  reference: string,
  email: string,
  signal?: AbortSignal,
) {
  const { Result } = (await resDiary(
    "POST",
    `Booking/${encodeURIComponent(reference)}/AuthenticateV2`,
    { Email: email },
    signal,
  )) as { Result: string };
  return (await resDiary(
    "GET",
    `Booking/${encodeURIComponent(reference)}?${new URLSearchParams({ authenticationToken: Result })}`,
    undefined,
    signal,
  )) as { BookingStatus: string; DepositPaidAmount?: number | null };
}

async function cancelSandboxBooking(reference: string, email: string) {
  const reasons = (await resDiary(
    "GET",
    "CancellationReasons?onlyEnabledReasons=true",
  )) as { Id: number }[];
  const [reason] = reasons;
  if (!reason) throw new Error("The sandbox has no cancellation reason.");
  let status = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await resDiary(
      "POST",
      `Booking/${encodeURIComponent(reference)}/Cancel?${new URLSearchParams({ cancellationReasonId: String(reason.Id) })}`,
    );
    for (const delay of [500, 1500]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      status = await cleanupStatus(reference, email);
      if (status === "Cancelled" || status === "TableHoldExpired")
        return status;
    }
  }
  return status;
}

async function cleanupStatus(reference: string, email: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { BookingStatus } = await sandboxBooking(
        reference,
        email,
        AbortSignal.timeout(2_000),
      );
      if (typeof BookingStatus !== "string") throw new Error();
      console.info(`[cleanup] ${reference}: ${BookingStatus}`);
      return BookingStatus;
    } catch {
      console.info(`[cleanup] ${reference}: status read ${attempt}/3 failed`);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }
  throw new Error(`[cleanup] ${reference}: could not read booking status`);
}

async function sandboxTimes(date: string, partySize: number) {
  const reply = (await sandbox("AvailabilitySearch", {
    VisitDate: date,
    PartySize: partySize,
  })) as {
    TimeSlots?: {
      TimeSlot: string;
      HasStandardAvailability: boolean;
      IsLeaveTimeRequired?: boolean | null;
      LeaveTime?: string | null;
      StandardAvailabilityFeeAmount?: number | null;
    }[];
  };
  const times = new Map<
    string,
    { leave: string | null; required: boolean; fee: number }
  >();
  for (const slot of reply.TimeSlots ?? []) {
    if (slot.HasStandardAvailability && slot.TimeSlot.startsWith(date)) {
      times.set(slot.TimeSlot.slice(11, 16), {
        leave: slot.LeaveTime?.slice(0, 5) ?? null,
        required: slot.IsLeaveTimeRequired === true,
        fee: slot.StandardAvailabilityFeeAmount ?? 0,
      });
    }
  }
  return [...times.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, rest]) => ({ time, ...rest }));
}

async function sandboxOpenDates(from: string, to: string, partySize: number) {
  const body = (await sandbox("AvailabilityForDateRangeV2", {
    DateFrom: `${from}T00:00:00`,
    DateTo: `${to}T00:00:00`,
    PartySize: partySize,
  })) as {
    AvailableDates?: { Date: string; AvailableTimes?: unknown[] }[];
  };
  return new Set(
    (body.AvailableDates ?? [])
      .filter((day) => (day.AvailableTimes ?? []).length > 0)
      .map((day) => day.Date.slice(0, 10)),
  );
}

test("the calendar offers exactly the days the ResDiary sandbox has tables for", async ({
  page,
}) => {
  test.setTimeout(120_000);
  expect(new URL(process.env.RESDIARY_API_URL ?? "").hostname).toBe(
    "api.rdbranch.com",
  );
  const today = dublinToday();

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const partySize = Number.parseInt(
    (await reservations
      .getByRole("combobox", { name: "Party size" })
      .textContent()) ?? "",
    10,
  );
  const picker = bookingCalendar(reservations);
  await picker.open();

  for (const month of ["this month", "next month"]) {
    if (month === "next month") await picker.next.click();
    await expect(picker.calendar.getByRole("status")).toHaveText("", {
      timeout: 20_000,
    });
    const days = await shownDays(picker.calendar);
    const first = days[0]?.date ?? today;
    const open = await sandboxOpenDates(
      first < today ? today : first,
      days.at(-1)?.date ?? today,
      partySize,
    );

    expect(
      days.filter((day) => day.enabled).map((day) => day.date),
      month,
    ).toEqual(days.map((day) => day.date).filter((date) => open.has(date)));
  }
});

test("Find a Table shows exactly the bookable times ResDiary's sandbox has for the day", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const slots = await sandboxTimes(date, 2);
  if (slots.length === 0)
    throw new Error(`The sandbox has no times on ${date}.`);

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await expect(
    reservations.getByRole("combobox", { name: "Party size" }),
  ).toHaveText("2 guests");
  await chooseDate(reservations, date);
  const started = Date.now();
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  const times = reservations.getByRole("group", {
    name: "Available times",
    exact: true,
  });
  await expect(times.getByRole("button").first()).toBeVisible({
    timeout: 20_000,
  });
  const elapsedMs = Date.now() - started;
  test.info().annotations.push({
    type: "speed",
    description: `${date}: real times on screen ${elapsedMs} ms after Find a Table`,
  });
  console.info(`[speed] ${date}: times on screen after ${elapsedMs} ms`);

  await expect(times.getByRole("button")).toHaveText(
    slots.map((slot) => clockLabel(slot.time)),
  );
  const next = reservations.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  const optional = slots.find((slot) => slot.leave && !slot.required);
  if (optional?.leave) {
    await times
      .getByRole("button", { name: clockLabel(optional.time), exact: true })
      .click();
    await expect(
      reservations.getByText(`Table until ${clockLabel(optional.leave)}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(next).toBeEnabled();
  }
  const required = slots.find((slot) => slot.leave && slot.required);
  if (required?.leave) {
    await times
      .getByRole("button", { name: clockLabel(required.time), exact: true })
      .click();
    await expect(next).toBeDisabled();
    await reservations
      .getByLabel(
        `I understand the table is required back by ${clockLabel(required.leave)}`,
      )
      .check();
    await expect(next).toBeEnabled();
  }
  test.info().annotations.push({
    type: "return times",
    description: `optional ${optional?.time ?? "none"}, required ${required?.time ?? "none"}`,
  });
});

const HOLD_KEY = "peploes:booking-hold";

interface IStoredHold {
  holdReference: string;
  holdRevision: number;
}

function secondsLeft(text: string | null): number {
  const [, minutes = "0", seconds = "0"] = text?.match(/(\d+):(\d{2})/) ?? [];
  return Number(minutes) * 60 + Number(seconds);
}

test("Continue holds the table on ResDiary, moves it, keeps it on reload and lets it run out", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.clock.install();
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const [first, second] = (await sandboxTimes(date, 2)).filter(
    (slot) => !slot.required,
  );
  if (!(first && second))
    throw new Error(`The sandbox needs two times on ${date}.`);

  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const times = reservations.getByRole("group", {
    name: "Available times",
    exact: true,
  });
  const details = reservations.getByRole("heading", {
    name: "Your details",
    exact: true,
  });
  const timer = reservations.getByRole("timer");
  const stored = () =>
    page.evaluate(
      (key) =>
        JSON.parse(sessionStorage.getItem(key) ?? "null") as IStoredHold | null,
      HOLD_KEY,
    );

  await chooseDate(reservations, date);
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await times
    .getByRole("button", { name: clockLabel(first.time), exact: true })
    .click();
  const started = Date.now();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(details).toBeVisible({ timeout: 20_000 });
  const elapsedMs = Date.now() - started;
  test.info().annotations.push({
    type: "speed",
    description: `${date} ${first.time}: table held ${elapsedMs} ms after Continue`,
  });
  console.info(`[speed] ${date} ${first.time}: held after ${elapsedMs} ms`);

  await expect(timer).toHaveText(/^Table held for 4:[0-5]\d$/);
  const held = await stored();
  expect(held?.holdReference).toMatch(/^[A-Z0-9]{6,12}$/);
  expect(held?.holdRevision).toBe(1);
  const status = await page.evaluate(
    async ({ holdReference, holdRevision }) =>
      (await fetch(
        `/api/bookings/hold-status?${new URLSearchParams({ holdReference, holdRevision: String(holdRevision) })}`,
      ).then((reply) => reply.json())) as {
        ok: boolean;
        data?: { status: string };
      },
    {
      holdReference: held?.holdReference ?? "",
      holdRevision: held?.holdRevision ?? 0,
    },
  );
  expect(status).toMatchObject({ ok: true, data: { status: "pending" } });
  const leftAfterHold = secondsLeft(await timer.textContent());
  expect(leftAfterHold).toBeLessThanOrEqual(295);

  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await times
    .getByRole("button", { name: clockLabel(second.time), exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(details).toBeVisible({ timeout: 20_000 });
  const moved = await stored();
  expect(moved).toMatchObject({
    holdReference: held?.holdReference,
    holdRevision: 2,
    choice: { searchDate: date, time: second.time, partySize: 2 },
  });
  expect(secondsLeft(await timer.textContent())).toBeLessThanOrEqual(
    leftAfterHold,
  );
  await expect(reservations.getByText(clockLabel(second.time))).toBeVisible();

  await page.reload();
  await expect(details).toBeVisible({ timeout: 20_000 });
  await expect(timer).toHaveText(/^Table held for [0-4]:[0-5]\d$/);
  expect((await stored())?.holdReference).toBe(held?.holdReference);

  await page.clock.fastForward("05:00");
  await expect(
    reservations.getByText(
      "Your table hold ran out. Please choose a time again.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(await stored()).toBeNull();
});

const TEST_EMAIL =
  process.env.BOOKING_SANDBOX_TEST_EMAIL ?? "booking-test@example.com";

async function holdTime(page: Page, date: string, time: string, partySize = 2) {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseGuests(reservations, partySize);
  await chooseDate(reservations, date);
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(
    reservations
      .getByRole("group", { name: "Available times", exact: true })
      .getByRole("button", { name: clockLabel(time), exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await reservations
    .getByRole("group", { name: "Available times", exact: true })
    .getByRole("button", { name: clockLabel(time), exact: true })
    .click();
  const required = reservations.getByLabel(
    /I understand the table is required back by/,
  );
  if (await required.count()) await required.check();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(reservations.getByRole("timer")).toBeVisible({
    timeout: 20_000,
  });
  return reservations;
}

async function fillDetails(reservations: Locator, surname: string) {
  await reservations.getByLabel("First name", { exact: false }).fill("Sandbox");
  await reservations.getByLabel("Surname", { exact: false }).fill(surname);
  await expect(
    reservations.getByRole("combobox", { name: "Country code" }),
  ).toHaveValue("353");
  await reservations
    .getByLabel("Mobile number", { exact: false })
    .fill("087 123 4567");
  await reservations
    .getByLabel("Email address", { exact: false })
    .fill(TEST_EMAIL);
  await reservations
    .getByLabel("Special requests (optional)")
    .fill("Sandbox test from the booking page tests. Please ignore.");
  await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
}

function heldReference(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (
        JSON.parse(sessionStorage.getItem("peploes:booking-hold") ?? "{}") as {
          holdReference?: string;
        }
      ).holdReference ?? "",
  );
}

async function cleanUp(reference: string) {
  let status = await cleanupStatus(reference, TEST_EMAIL);
  if (status === "Booked" || status === "TableHold") {
    console.info(`[cleanup] ${reference}: cancelling ${status}`);
    try {
      status = await cancelSandboxBooking(reference, TEST_EMAIL);
    } catch {
      throw new Error(
        `[cleanup] ${reference}: cancellation could not be verified`,
      );
    }
  }
  if (status !== "Cancelled" && status !== "TableHoldExpired") {
    throw new Error(
      `[cleanup] ${reference}: unresolved booking status ${status}`,
    );
  }
  console.info(`[cleanup] ${reference}: verified final status ${status}`);
}

test("cleanup cancels a deposit hold before payment and verifies it has ended", async ({
  page,
}) => {
  test.setTimeout(180_000);
  let held = "";
  try {
    await depositStep(page, "Pending Cleanup");
    held = await heldReference(page);
    expect((await sandboxBooking(held, TEST_EMAIL)).BookingStatus).toBe(
      "TableHold",
    );
  } finally {
    const reference = held || (await heldReference(page));
    if (reference) await cleanUp(reference);
  }
  expect((await sandboxBooking(held, TEST_EMAIL)).BookingStatus).toBe(
    "Cancelled",
  );
});

test("Confirm Reservation books a no-deposit table on ResDiary and shows its reference", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const slot = (await sandboxTimes(date, 2)).find(
    (candidate) => candidate.fee === 0 && !candidate.required,
  );
  if (!slot) throw new Error(`The sandbox has no free time on ${date}.`);

  const reservations = await holdTime(page, date, slot.time);
  await fillDetails(reservations, "Booking Test");
  const held = await heldReference(page);
  expect(held).toMatch(/^[A-Z0-9]{6,12}$/);
  try {
    const started = Date.now();
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", {
        name: "Your table is booked.",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });
    console.info(
      `[speed] ${date} ${slot.time}: booked after ${Date.now() - started} ms`,
    );
    const reference = (
      await reservations
        .locator("p", { hasText: "Booking reference" })
        .locator("strong")
        .textContent()
    )?.trim();
    expect(reference).toMatch(/^[A-Z0-9]{6,12}$/);
    expect(reference).toBe(held);
    expect(
      (await sandboxBooking(reference ?? "", TEST_EMAIL)).BookingStatus,
    ).toBe("Booked");
    await expect(
      reservations.getByText("Sample booking reference"),
    ).toHaveCount(0);
  } finally {
    await cleanUp(held);
  }
});

test("a deposit is paid with Stripe on ResDiary's key and ResDiary confirms the booking", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const stripeKeys = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!url.hostname.endsWith("stripe.com")) return;
    const key =
      url.searchParams.get("key") ??
      request.postData()?.match(/(?:^|&)key=(pk_[A-Za-z0-9_]+)/)?.[1];
    if (key) stripeKeys.add(key);
  });
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const slot = (await sandboxTimes(date, 2)).find(
    (candidate) => candidate.fee > 0,
  );
  if (!slot) throw new Error(`The sandbox has no deposit time on ${date}.`);

  const reservations = await holdTime(page, date, slot.time);
  await fillDetails(reservations, "Deposit Test");
  const held = await heldReference(page);
  expect(held).toMatch(/^[A-Z0-9]{6,12}$/);
  try {
    const intentReply = page.waitForResponse(
      (response) =>
        /api\.stripe\.com\/v1\/payment_intents\/pi_[^/?]+\?/.test(
          response.url(),
        ) && response.request().method() === "GET",
    );
    const started = Date.now();
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });
    console.info(
      `[speed] ${date} ${slot.time}: deposit step after ${Date.now() - started} ms`,
    );

    const intent = (await (await intentReply).json()) as {
      amount: number;
      currency: string;
    };
    expect(intent.amount).toBe(Math.round(slot.fee * 100));
    const amount = new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: intent.currency.toUpperCase(),
    }).format(intent.amount / 100);
    await expect(
      reservations.getByText(
        `A ${amount} deposit is needed to reserve this table.`,
        {
          exact: true,
        },
      ),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      reservations.getByRole("button", { name: `Pay ${amount} and Reserve` }),
    ).toBeEnabled({ timeout: 20_000 });
    await expect(
      reservations
        .locator('iframe[title="Secure payment input frame"]')
        .contentFrame()
        .locator('input[name="number"]'),
    ).toBeVisible();
    await reservations.screenshot({
      path: test.info().outputPath("deposit-step.png"),
    });
    expect(stripeKeys.size).toBeGreaterThan(0);
    expect([...stripeKeys].every((key) => key.startsWith("pk_test_"))).toBe(
      true,
    );

    const card = reservations
      .locator('iframe[title="Secure payment input frame"]')
      .contentFrame();
    await card.locator('input[name="number"]').fill("4242 4242 4242 4242");
    await card.locator('input[name="expiry"]').fill("12 / 34");
    await card.locator('input[name="cvc"]').fill("123");
    const paid = Date.now();
    await reservations
      .getByRole("button", { name: `Pay ${amount} and Reserve`, exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", {
        name: "Your table is booked.",
        exact: true,
      }),
    ).toBeVisible({ timeout: 90_000 });
    console.info(
      `[speed] ${date} ${slot.time}: confirmed ${Date.now() - paid} ms after Pay`,
    );
    const reference = (
      await reservations
        .locator("p", { hasText: "Booking reference" })
        .locator("strong")
        .textContent()
    )?.trim();
    expect(reference).toMatch(/^[A-Z0-9]{6,12}$/);
    expect(reference).toBe(held);
    const booking = await sandboxBooking(reference ?? "", TEST_EMAIL);
    expect(booking.BookingStatus).toBe("Booked");
    expect(booking.DepositPaidAmount).toBe(slot.fee);
  } finally {
    await cleanUp(held);
  }
});

for (const scenario of ["standard", "declined", "3ds"] as const) {
  test(`a ${scenario} card guarantee saves a card without a deposit and ResDiary confirms`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const partySize = 7;
    const tomorrow = addDays(dublinToday(), 1);
    const [date] = [
      ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), partySize)),
    ].sort();
    if (!date) throw new Error("No sandbox date has a table for seven guests.");
    const slot = (await sandboxTimes(date, partySize)).find(
      (candidate) => candidate.fee === 0 && !candidate.required,
    );
    if (!slot) throw new Error("No no-deposit sandbox time for seven guests.");
    const reservations = await holdTime(page, date, slot.time, partySize);
    const held = await heldReference(page);
    const paymentConfirmations: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /api\.stripe\.com\/v1\/payment_intents\/[^/]+\/confirm/.test(
          request.url(),
        )
      ) {
        paymentConfirmations.push(request.url());
      }
    });
    try {
      await fillDetails(reservations, `Guarantee ${scenario} Test`);
      const intentReply = page.waitForResponse(
        (response) =>
          /api\.stripe\.com\/v1\/setup_intents\/seti_[^/?]+\?/.test(
            response.url(),
          ) && response.request().method() === "GET",
      );
      await reservations
        .getByRole("button", { name: "Confirm Reservation", exact: true })
        .click();
      const setupResponse = await intentReply;
      const setup: { livemode: boolean } = await setupResponse.json();
      expect(setup.livemode).toBe(false);
      expect(new URL(setupResponse.url()).searchParams.get("key")).toMatch(
        /^pk_test_/,
      );
      const save = reservations.getByRole("button", {
        name: "Save Card and Reserve",
        exact: true,
      });
      await expect(save).toBeEnabled({ timeout: 30_000 });
      await expect(
        reservations.getByRole("button", { name: /^Pay / }),
      ).toHaveCount(0);
      if (scenario === "standard") {
        await page.reload();
        await expect(save).toBeEnabled({ timeout: 30_000 });
      }
      if (scenario === "declined") {
        await enterCard(reservations, "4000 0000 0000 0002");
        await save.click();
        await expect(reservations.getByRole("alert")).toContainText(
          /declined/i,
          { timeout: 30_000 },
        );
        await expect(save).toBeEnabled();
      }
      await enterCard(
        reservations,
        scenario === "3ds" ? "4000 0027 6000 3184" : "4242 4242 4242 4242",
      );
      await save.click();
      if (scenario === "3ds") await completeTestChallenge(page);
      expect(await confirmedReference(reservations)).toBe(held);
      const booking = await sandboxBooking(held, TEST_EMAIL);
      expect(booking.BookingStatus).toBe("Booked");
      expect(booking.DepositPaidAmount ?? 0).toBe(0);
      expect(paymentConfirmations).toEqual([]);
      const stripeAccount = await setupResponse
        .request()
        .headerValue("stripe-account");
      const finalSetup = await page.request.get(setupResponse.url(), {
        headers: stripeAccount ? { "stripe-account": stripeAccount } : {},
      });
      expect(finalSetup.ok()).toBe(true);
      expect(await finalSetup.json()).toMatchObject({
        status: "succeeded",
        livemode: false,
      });
      await reservations.screenshot({
        path: test.info().outputPath(`guarantee-${scenario}-confirmed.png`),
      });
    } finally {
      await cleanUp(held);
    }
  });
}

async function depositStep(page: Page, surname: string) {
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const slot = (await sandboxTimes(date, 2)).find(
    (candidate) => candidate.fee > 0,
  );
  if (!slot) throw new Error(`The sandbox has no deposit time on ${date}.`);
  const reservations = await holdTime(page, date, slot.time);
  await fillDetails(reservations, surname);
  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30_000 });
  const pay = reservations.getByRole("button", {
    name: /^Pay .* and Reserve$/,
  });
  await expect(pay).toBeEnabled({ timeout: 20_000 });
  return { reservations, pay };
}

async function holdDeposit(page: Page, surname: string) {
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const slot = (await sandboxTimes(date, 2)).find(
    (candidate) => candidate.fee > 0,
  );
  if (!slot) throw new Error(`The sandbox has no deposit time on ${date}.`);
  const reservations = await holdTime(page, date, slot.time);
  await fillDetails(reservations, surname);
  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();
  await expect(
    reservations.getByRole("heading", {
      name: "Secure your table",
      exact: true,
    }),
  ).toBeVisible({ timeout: 30_000 });
  return reservations;
}

async function enterCard(reservations: Locator, number: string) {
  const card = reservations
    .locator('iframe[title="Secure payment input frame"]')
    .contentFrame();
  await card.locator('input[name="number"]').fill(number);
  await card.locator('input[name="expiry"]').fill("12 / 34");
  await card.locator('input[name="cvc"]').fill("123");
}

async function confirmedReference(reservations: Locator) {
  await expect(
    reservations.getByRole("heading", {
      name: "Your table is booked.",
      exact: true,
    }),
  ).toBeVisible({ timeout: 90_000 });
  await expect(
    reservations.locator("p", { hasText: "Booking reference" }),
  ).toBeVisible();
  return (
    (await reservations
      .locator("p", { hasText: "Booking reference" })
      .locator("strong")
      .textContent()) ?? ""
  ).trim();
}

async function completeTestChallenge(page: Page) {
  await expect
    .poll(
      async () => {
        for (const frame of page.frames()) {
          const complete = frame.locator("#test-source-authorize-3ds");
          if (await complete.isVisible().catch(() => false)) {
            await frame.waitForLoadState("load");
            await complete.click();
            const closed = await complete
              .waitFor({ state: "detached", timeout: 10_000 })
              .then(() => true)
              .catch(() => false);
            if (closed) return true;
          }
        }
        return false;
      },
      { timeout: 60_000 },
    )
    .toBe(true);
}

test("a 3-D Secure card completes Stripe's bank check and ResDiary confirms the booking", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { reservations, pay } = await depositStep(page, "Secure Test");
  const held = await heldReference(page);
  expect(held).toMatch(/^[A-Z0-9]{6,12}$/);
  try {
    await enterCard(reservations, "4000 0027 6000 3184");
    await pay.click();
    await completeTestChallenge(page);
    const reference = await confirmedReference(reservations);
    expect(reference).toMatch(/^[A-Z0-9]{6,12}$/);
    expect(reference).toBe(held);
    const booking = await sandboxBooking(reference, TEST_EMAIL);
    expect(booking.BookingStatus).toBe("Booked");
    expect(booking.DepositPaidAmount).toBeGreaterThan(0);
  } finally {
    await cleanUp(held);
  }
});

test("a declined card shows Stripe's message and a second card books the table", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { reservations, pay } = await depositStep(page, "Declined Test");
  const held = await heldReference(page);
  expect(held).toMatch(/^[A-Z0-9]{6,12}$/);
  try {
    await enterCard(reservations, "4000 0000 0000 0002");
    await pay.click();
    await expect(reservations.getByRole("alert")).toContainText(/declined/i, {
      timeout: 30_000,
    });
    await expect(pay).toBeEnabled();

    await enterCard(reservations, "4242 4242 4242 4242");
    await pay.click();
    const reference = await confirmedReference(reservations);
    expect(reference).toMatch(/^[A-Z0-9]{6,12}$/);
    expect(reference).toBe(held);
    expect((await sandboxBooking(reference, TEST_EMAIL)).BookingStatus).toBe(
      "Booked",
    );
  } finally {
    await cleanUp(held);
  }
});

interface IStripeIntent {
  id: string;
  clientSecret: string;
  key: string;
  account: string;
}

async function depositIntent(page: Page, surname: string) {
  const intentRequest = page.waitForRequest(
    (request) =>
      /api\.stripe\.com\/v1\/payment_intents\/pi_[^/?]+\?/.test(
        request.url(),
      ) && request.method() === "GET",
  );
  const { reservations, pay } = await depositStep(page, surname);
  const request = await intentRequest;
  const url = new URL(request.url());
  const headers = await request.allHeaders();
  const intent: IStripeIntent = {
    id: url.pathname.split("/").at(-1) ?? "",
    clientSecret: url.searchParams.get("client_secret") ?? "",
    key: url.searchParams.get("key") ?? "",
    account:
      url.searchParams.get("_stripe_account") ??
      headers["stripe-account"] ??
      "",
  };
  expect(intent.key.startsWith("pk_test_")).toBe(true);
  expect(intent.clientSecret.startsWith(`${intent.id}_secret_`)).toBe(true);
  return { reservations, pay, intent };
}

async function payOutsideThePage(intent: IStripeIntent) {
  const reply = await fetch(
    `https://api.stripe.com/v1/payment_intents/${intent.id}/confirm`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${intent.key}`,
        "stripe-account": intent.account,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_secret: intent.clientSecret,
        payment_method: "pm_card_visa",
        return_url: "https://example.com/book-a-table",
      }),
    },
  );
  return ((await reply.json()) as { status?: string }).status;
}

function bankReturn(intent: IStripeIntent, status: string) {
  return `/book-a-table?${new URLSearchParams({
    payment_intent: intent.id,
    payment_intent_client_secret: intent.clientSecret,
    redirect_status: status,
  })}`;
}

test("returning from a bank's own page after paying shows ResDiary's confirmation", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { intent } = await depositIntent(page, "Bank Return");
  const held = await heldReference(page);
  expect(held).toMatch(/^[A-Z0-9]{6,12}$/);
  try {
    expect(await payOutsideThePage(intent)).toBe("succeeded");
    await page.goto(bankReturn(intent, "succeeded"));
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    expect(await confirmedReference(reservations)).toBe(held);
    expect(new URL(page.url()).search).toBe("");
    const booking = await sandboxBooking(held, TEST_EMAIL);
    expect(booking.BookingStatus).toBe("Booked");
    expect(booking.DepositPaidAmount).toBeGreaterThan(0);
  } finally {
    await cleanUp(held);
  }
});

test("returning from a bank's own page after a refusal shows the card form again", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { intent } = await depositIntent(page, "Bank Refusal");
  const held = await heldReference(page);
  try {
    await page.goto(bankReturn(intent, "failed"));
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    await expect(
      reservations.getByText(
        "Your bank didn't approve the payment. Please try again or use another card.",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 30_000 });
    expect(new URL(page.url()).search).toBe("");
    const pay = reservations.getByRole("button", {
      name: /^Pay .* and Reserve$/,
    });
    await expect(pay).toBeEnabled({ timeout: 20_000 });
    await enterCard(reservations, "4242 4242 4242 4242");
    await pay.click();
    expect(await confirmedReference(reservations)).toBe(held);
    expect((await sandboxBooking(held, TEST_EMAIL)).BookingStatus).toBe(
      "Booked",
    );
  } finally {
    await cleanUp(held);
  }
});

test("if Stripe's script fails to load the guest sees why and can try again", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.route("https://js.stripe.com/**", (route) => route.abort());
  const reservations = await holdDeposit(page, "Stripe Blocked");
  const held = await heldReference(page);
  try {
    await expect(
      reservations.getByText(
        "We couldn't load the secure payment form. Check your connection and try again, or call us on +353 1 676 3144.",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      reservations.getByText("Loading secure payment…", { exact: true }),
    ).toHaveCount(0);
    await page.unroute("https://js.stripe.com/**");
    await reservations
      .getByRole("button", { name: "Try Again", exact: true })
      .click();
    const pay = reservations.getByRole("button", {
      name: /^Pay .* and Reserve$/,
    });
    await expect(pay).toBeEnabled({ timeout: 30_000 });
    await enterCard(reservations, "4242 4242 4242 4242");
    await pay.click();
    expect(await confirmedReference(reservations)).toBe(held);
  } finally {
    await cleanUp(held);
  }
});

test("a reload on the payment step brings the card form back without sending the details again", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { reservations } = await depositStep(page, "Reload Pay");
  const held = await heldReference(page);
  try {
    const posts: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/book-a-table")
      )
        posts.push(request.url());
    });
    await page.reload();
    const pay = reservations.getByRole("button", {
      name: /^Pay .* and Reserve$/,
    });
    await expect(pay).toBeEnabled({ timeout: 30_000 });
    expect(posts).toEqual([]);
    await enterCard(reservations, "4242 4242 4242 4242");
    await pay.click();
    expect(await confirmedReference(reservations)).toBe(held);
  } finally {
    await cleanUp(held);
  }
});

test("a reload after Stripe has taken the deposit shows ResDiary's confirmation, not the card form", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { intent } = await depositIntent(page, "Paid Reload");
  const held = await heldReference(page);
  try {
    expect(await payOutsideThePage(intent)).toBe("succeeded");
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    await page.route(
      `https://api.stripe.com/v1/payment_intents/${intent.id}?**`,
      async (route) => {
        await answered;
        await route.fallback();
      },
    );
    await page.reload();
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });
    const edit = reservations.getByRole("button", {
      name: "Edit date & guests",
    });
    await expect(edit).toBeDisabled();
    answer();
    expect(await confirmedReference(reservations)).toBe(held);
    expect((await sandboxBooking(held, TEST_EMAIL)).BookingStatus).toBe(
      "Booked",
    );
  } finally {
    await cleanUp(held);
  }
});

test("if Stripe's reply to Pay is lost after the charge, the page confirms the booking instead of offering Pay again", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const { reservations, pay } = await depositStep(page, "Lost Stripe Reply");
  const held = await heldReference(page);
  try {
    await page.route(
      "https://api.stripe.com/v1/payment_intents/*/confirm",
      async (route) => {
        await route.fetch();
        await route.abort("connectionreset");
      },
    );
    await enterCard(reservations, "4242 4242 4242 4242");
    await pay.click();
    expect(await confirmedReference(reservations)).toBe(held);
    const booking = await sandboxBooking(held, TEST_EMAIL);
    expect(booking.BookingStatus).toBe("Booked");
    expect(booking.DepositPaidAmount).toBeGreaterThan(0);
  } finally {
    await cleanUp(held);
  }
});

test("Edit on the deposit step leaves the old hold pending, and the new time gets its own deposit and booking", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const tomorrow = addDays(dublinToday(), 1);
  const [date] = [
    ...(await sandboxOpenDates(tomorrow, addDays(tomorrow, 13), 2)),
  ].sort();
  if (!date)
    throw new Error("The sandbox has no open day in the next two weeks.");
  const [first, second] = (await sandboxTimes(date, 2)).filter(
    (candidate) => candidate.fee > 0,
  );
  if (!(first && second))
    throw new Error(`The sandbox has fewer than two deposit times on ${date}.`);

  const reservations = await holdTime(page, date, first.time);
  const firstHold = await heldReference(page);
  let secondHold = "";
  try {
    await fillDetails(reservations, "Edit Deposit");
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30_000 });

    const edit = reservations.getByRole("button", {
      name: "Edit date & guests",
    });
    const dialog = page.getByRole("dialog", { name: "Change your booking?" });
    await edit.click();
    await expect(dialog).toContainText(
      `We'll let go of your table for ${clockLabel(first.time)}`,
    );
    await dialog
      .getByRole("button", { name: "Keep My Table", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(
      reservations.getByRole("heading", {
        name: "Secure your table",
        exact: true,
      }),
    ).toBeVisible();
    await edit.click();
    await dialog
      .getByRole("button", { name: "Choose Another Time", exact: true })
      .click();
    const findTable = reservations.getByRole("button", {
      name: "Find a Table",
      exact: true,
    });
    await expect(findTable).toBeVisible({ timeout: 20_000 });
    expect((await sandboxBooking(firstHold, TEST_EMAIL)).BookingStatus).toBe(
      "TableHold",
    );
    await findTable.click();
    await reservations
      .getByRole("group", { name: "Available times", exact: true })
      .getByRole("button", { name: clockLabel(second.time), exact: true })
      .click();
    const required = reservations.getByLabel(
      /I understand the table is required back by/,
    );
    if (await required.count()) await required.check();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    const confirm = reservations.getByRole("button", {
      name: "Confirm Reservation",
      exact: true,
    });
    await expect(confirm).toBeVisible({ timeout: 20_000 });
    await expect(
      reservations.getByRole("button", { name: /^Pay / }),
    ).toHaveCount(0);
    secondHold = await heldReference(page);
    expect(secondHold).not.toBe(firstHold);

    await confirm.click();
    const pay = reservations.getByRole("button", {
      name: /^Pay .* and Reserve$/,
    });
    await expect(pay).toBeEnabled({ timeout: 30_000 });
    await enterCard(reservations, "4242 4242 4242 4242");
    let release: () => void = () => undefined;
    const confirmed = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      "https://api.stripe.com/v1/payment_intents/*/confirm",
      async (route) => {
        await confirmed;
        await route.fallback();
      },
    );
    await pay.click();
    await expect(
      reservations.getByRole("button", { name: "Processing Payment…" }),
    ).toBeDisabled();
    await expect(edit).toBeDisabled();
    release();

    expect(await confirmedReference(reservations)).toBe(secondHold);
    await expect(
      reservations.getByText(clockLabel(second.time), { exact: false }),
    ).toBeVisible();
    expect((await sandboxBooking(secondHold, TEST_EMAIL)).BookingStatus).toBe(
      "Booked",
    );
  } finally {
    await cleanUp(firstHold);
    if (secondHold) await cleanUp(secondHold);
  }
});

test("if Stripe's card form fails to load inside Stripe, the guest sees why and can try again", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.route("https://api.stripe.com/v1/elements/sessions**", (route) =>
    route.abort(),
  );
  const reservations = await holdDeposit(page, "Card Form Blocked");
  const held = await heldReference(page);
  try {
    await expect(
      reservations.getByText(
        "We couldn't load the secure payment form. Check your connection and try again, or call us on +353 1 676 3144.",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      reservations.getByRole("button", { name: "Edit date & guests" }),
    ).toBeEnabled();
    await page.unroute("https://api.stripe.com/v1/elements/sessions**");
    await reservations
      .getByRole("button", { name: "Try Again", exact: true })
      .click();
    await expect(
      reservations.getByRole("button", { name: /^Pay .* and Reserve$/ }),
    ).toBeEnabled({ timeout: 30_000 });
  } finally {
    await cleanUp(held);
  }
});
