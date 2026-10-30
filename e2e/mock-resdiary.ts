// biome-ignore-all lint/style/useNamingConvention: ResDiary's API uses PascalCase field names.
import {
  addDays,
  closedPeriod,
  dublinToday,
  FAKE_RESDIARY,
  FAKE_TIMES,
  freeDates,
} from "./booking-fixtures";

const apiUrl = process.env.RESDIARY_API_URL;
if (apiUrl !== FAKE_RESDIARY.url && apiUrl !== FAKE_RESDIARY.downUrl) {
  throw new Error(
    "Booking browser tests require the fake ResDiary host, never a real one.",
  );
}

const restaurant = `/api/ConsumerApi/v1/Restaurant/${FAKE_RESDIARY.micrositeName}`;

function wireDate(date: string): string {
  return `${date}T00:00:00`;
}

function reply(method: string, pathname: string): unknown {
  if (method === "POST" && pathname === "/api/Jwt/v2/Authenticate") {
    return {
      Status: "Success",
      Token: "e2e-token",
      TokenExpiryUtc: new Date(Date.now() + 3_600_000).toISOString(),
    };
  }
  if (method === "GET" && pathname === `${restaurant}/Setup`) {
    return {
      MinOnlinePartySize: FAKE_RESDIARY.minPartySize,
      MaxOnlinePartySize: FAKE_RESDIARY.maxPartySize,
      OnlinePartySizeDefault: FAKE_RESDIARY.defaultPartySize,
      AcceptBookingsDaysInAdvance: FAKE_RESDIARY.daysAhead,
      Services: [
        { ServiceId: 1, Name: "Lunch", TimeFrom: "12:00:00" },
        { ServiceId: 2, Name: "Dinner", TimeFrom: "17:30:00" },
      ],
      CurrencyCode: "EUR",
      TermsAndConditions: "<p>Browser test booking terms.</p>",
    };
  }
  if (method === "GET" && pathname === `${restaurant}/ClosedDates`) {
    const today = dublinToday();
    const period = closedPeriod(today);
    return {
      ClosedDays: [FAKE_RESDIARY.closedWeekday],
      ClosedPeriods: [
        { StartDate: wireDate(period.from), EndDate: wireDate(period.to) },
      ],
    };
  }
  if (method === "GET" && pathname === `${restaurant}/CancellationReasons`) {
    return [
      {
        Id: 26952,
        Description: "Change of plans",
        DisplayOnline: true,
        ApplyToStandardBookings: true,
        IsNoShow: false,
        DoesBlock: false,
      },
    ];
  }
  if (method === "POST" && pathname.endsWith("/Cancel")) {
    const reference = pathname.split("/").at(-2) ?? "";
    const holdId = Number(reference.replace(/^E2E/, ""));
    if (holds.get(holdId)?.time === FAKE_RESDIARY.confirmedOnCancelTime) {
      booked.add(holdId);
    } else {
      cancelled.add(holdId);
    }
    return null;
  }
  throw new Error(`Unexpected ResDiary request in browser tests: ${pathname}`);
}

const holds = new Map<number, { expiresAt: number; time: string }>();

async function tableHold(method: string, body: string): Promise<Response> {
  const request = JSON.parse(body) as { BookingId?: number; VisitTime: string };
  const time = request.VisitTime.slice(0, 5);
  if (time === FAKE_RESDIARY.failingHoldTime) {
    return new Response(null, { status: 503 });
  }
  if (time === FAKE_RESDIARY.slowHoldTime) {
    await new Promise((resolve) =>
      setTimeout(resolve, FAKE_RESDIARY.slowDelayMs),
    );
  }
  if (method === "PUT" && request.BookingId !== undefined) {
    const held = holds.get(request.BookingId);
    const expiresAt = held?.expiresAt ?? Date.now();
    holds.set(request.BookingId, { expiresAt, time });
    return Response.json({
      ExpiryTimestamp: new Date(expiresAt).toISOString(),
    });
  }
  const holdId = holds.size + 1;
  const expiresAt = Date.now() + FAKE_RESDIARY.holdMs;
  holds.set(holdId, { expiresAt, time });
  return Response.json({
    BookingId: holdId,
    BookingReference: `E2E${String(holdId).padStart(5, "0")}`,
    ExpiryTimestamp: new Date(expiresAt).toISOString(),
  });
}

async function failOrWait(partySize: number): Promise<Response | null> {
  if (partySize === FAKE_RESDIARY.failingPartySize) {
    return new Response(null, { status: 503 });
  }
  if (partySize === FAKE_RESDIARY.slowPartySize) {
    await new Promise((resolve) =>
      setTimeout(resolve, FAKE_RESDIARY.slowDelayMs),
    );
  }
  return null;
}

async function availableTimes(body: string): Promise<Response> {
  const search = JSON.parse(body) as { VisitDate: string; PartySize: number };
  const failed = await failOrWait(search.PartySize);
  if (failed) return failed;
  const date = search.VisitDate.slice(0, 10);
  const free = freeDates(dublinToday(), search.PartySize).includes(date);
  return Response.json({
    StandardAvailabilityMayRequireCreditCard: false,
    TimeSlots: free
      ? FAKE_TIMES.map((slot) => ({
          TimeSlot: `${date}T${slot.time}:00`,
          ServiceId: slot.time < "17:30" ? 1 : 2,
          HasStandardAvailability: true,
          StandardAvailabilityFeeAmount:
            slot.time === FAKE_RESDIARY.depositTime ? 20 : 0,
          IsLeaveTimeRequired: slot.required,
          LeaveTime: `${slot.leave}:00`,
          AvailablePromotions: [],
        }))
      : [],
  });
}

async function availableDates(body: string): Promise<Response> {
  const search = JSON.parse(body) as {
    DateFrom: string;
    DateTo: string;
    PartySize: number;
  };
  const failed = await failOrWait(search.PartySize);
  if (failed) return failed;
  const free = freeDates(dublinToday(), search.PartySize);
  const to = search.DateTo.slice(0, 10);
  const days = [];
  for (let date = search.DateFrom.slice(0, 10); date <= to; ) {
    days.push({
      Date: wireDate(date),
      AvailableTimes: free.includes(date) ? [{ TimeSlot: "18:00:00" }] : [],
    });
    date = addDays(date, 1);
  }
  return Response.json({ AvailableDates: days });
}

const booked = new Set<number>();
const cancelled = new Set<number>();

function holdState(holdId: number): string {
  if (cancelled.has(holdId)) return "Cancelled";
  if (holds.get(holdId)?.time === FAKE_RESDIARY.failingStatusTime) {
    return "Failed";
  }
  return booked.has(holdId) ? "Confirmed" : "Pending";
}

function holdStatus(pathname: string): Response {
  const holdId = Number(pathname.split("/").at(-1));
  return Response.json({ Status: holdState(holdId), Booking: null });
}

let bookings = 0;

function guestDetails(body: string): Response {
  const request = JSON.parse(body) as {
    BookingId: number;
    Customer: { Email: string };
  };
  if (request.Customer.Email === FAKE_RESDIARY.lostReplyEmail) {
    return new Response(null, { status: 500 });
  }
  if (holds.get(request.BookingId)?.time === FAKE_RESDIARY.depositTime) {
    return Response.json({
      Status: "PaymentRequired",
      PaymentAmount: 20,
      FormattedPaymentAmount: "€20.00",
      StripePublishableKey: "pk_live_e2e_stub_only",
      StripeAccountId: "acct_e2e",
      PaymentIntentSecret: "pi_e2e_secret_stub_only",
    });
  }
  booked.add(request.BookingId);
  bookings += 1;
  return Response.json({
    Status: "Success",
    Booking: { Reference: `E2EBK${String(bookings).padStart(4, "0")}` },
  });
}

const routes: [
  string,
  (body: string, pathname: string) => Promise<Response> | Response,
][] = [
  [`POST ${restaurant}/AvailabilityForDateRangeV2`, availableDates],
  [`POST ${restaurant}/AvailabilitySearch`, availableTimes],
  [`POST ${restaurant}/CreateTableHold`, (body) => tableHold("POST", body)],
  [
    `PUT ${restaurant}/UpdateTableHoldBookingDetails`,
    (body) => tableHold("PUT", body),
  ],
  [
    `GET ${restaurant}/TableHoldBookingStatus/`,
    (_, pathname) => holdStatus(pathname),
  ],
  [
    `PUT /api/Restaurant/${FAKE_RESDIARY.micrositeName}/UpdateTableHoldWithCustomer`,
    guestDetails,
  ],
];

const fetchNetwork = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin === FAKE_RESDIARY.downUrl) {
    await new Promise((resolve) =>
      setTimeout(resolve, FAKE_RESDIARY.downDelayMs),
    );
    return new Response(null, { status: 503 });
  }
  if (url.origin !== FAKE_RESDIARY.url) {
    return await fetchNetwork(input, init);
  }
  const method = init?.method ?? "GET";
  const route = routes.find(([key]) => {
    const [routeMethod, path = ""] = key.split(" ");
    return (
      routeMethod === method &&
      (path.endsWith("/")
        ? url.pathname.startsWith(path)
        : url.pathname === path)
    );
  });
  if (route) return await route[1](String(init?.body), url.pathname);
  return Response.json(reply(method, url.pathname));
};
