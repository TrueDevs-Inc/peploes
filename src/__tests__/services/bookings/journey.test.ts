import { describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  FRIDAY,
  HOLD_QUERY,
  HOLD_SECRET,
  NOW,
  SANDBOX_TERMS_HTML,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { ErrorCode } from "@/lib/enums";
import { createResDiaryProvider } from "@/lib/resdiary-provider";
import type { IResDiaryConfig, IResDiaryReply } from "@/lib/types";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

interface IRecordedRequest {
  method: string;
  path: string;
  body: unknown;
}

type THandler = () => IResDiaryReply;

const CONFIG: IResDiaryConfig = {
  apiUrl: "https://api.example.test",
  micrositeName: "PeploesTest",
  channelCode: "ONLINE",
  username: "api-user",
  password: "api-password",
};

function reply(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
): THandler {
  const text = body === undefined ? "" : JSON.stringify(body);
  return function scriptedReply() {
    return {
      status,
      headers: new Headers(headers),
      text: () => Promise.resolve(text),
    };
  };
}

function fakeResDiary(routes: Record<string, THandler | THandler[]>) {
  const requests: IRecordedRequest[] = [];
  const queues = new Map(
    Object.entries(routes).map(function toQueue([route, handlers]) {
      return [route, Array.isArray(handlers) ? [...handlers] : [handlers]];
    }),
  );

  function matches(route: string, request: IRecordedRequest): boolean {
    const [method, suffix] = route.split(" ");
    return method === request.method && request.path.endsWith(suffix ?? "");
  }

  function fetch(url: string, init: RequestInit): Promise<IResDiaryReply> {
    const request: IRecordedRequest = {
      method: init.method ?? "GET",
      path: new URL(url).pathname,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    };
    requests.push(request);
    const route = [...queues.keys()].find((key) => matches(key, request));
    const queue = route ? (queues.get(route) ?? []) : [];
    const handler = queue.length > 1 ? queue.shift() : queue[0];
    if (!handler) {
      return Promise.reject(
        new Error(`No fake route for ${request.method} ${request.path}`),
      );
    }
    return Promise.resolve(handler());
  }

  function count(route: string): number {
    return requests.filter((request) => matches(route, request)).length;
  }

  function bodies(route: string): unknown[] {
    return requests
      .filter((request) => matches(route, request))
      .map((request) => request.body);
  }

  return { fetch, requests, count, bodies };
}

const SIGNED_IN = reply(200, {
  Status: "Success",
  Token: "token-1",
  TokenExpiryUtc: "2026-10-16T04:23:04.1130000",
});

const SETUP = {
  RestaurantId: 3899,
  Name: "Peploes Test",
  MaxOnlinePartySize: 7,
  MinOnlinePartySize: 1,
  OnlinePartySizeDefault: 2,
  Services: [
    { ServiceId: 8855, Name: "Lunch", TimeFrom: "12:00:00" },
    { ServiceId: 8856, Name: "Dinner", TimeFrom: "18:00:00" },
  ],
  IsMembershipIdEnabled: true,
  IsMembershipIdRequired: false,
  MembershipIdTitle: "Do It All ID",
  CustomField: null,
  NoAvailabilityText: "",
  DisplayPhoneNumberWhenNoAvailability: false,
  ReservationPhoneNumber: "0",
  CurrencyCode: "EUR",
  TermsAndConditions: SANDBOX_TERMS_HTML,
  PrivacyPolicy: "",
  AcceptBookingsDaysInAdvance: 365,
  StripeInfo: {
    StripePublishableKey: "pk_test_fixture",
    UseLiveToken: false,
    IsEnabled: true,
    StripeAccountId: "acct_fixture",
  },
  PaymentProvider: "Stripe",
};

const CLOSED_DATES = { ClosedDays: ["Monday"], ClosedPeriods: [] };

const LUNCH_SLOT = {
  TimeSlot: "2026-10-23T12:30:00",
  IsLeaveTimeRequired: false,
  LeaveTime: "14:00:00",
  ServiceId: 8855,
  HasStandardAvailability: true,
  AvailablePromotions: [],
  StandardAvailabilityFeeAmount: 0,
};
const PROMOTION_SLOT = {
  TimeSlot: "2026-10-23T18:30:00",
  IsLeaveTimeRequired: true,
  LeaveTime: "20:00:00",
  ServiceId: 8856,
  HasStandardAvailability: false,
  AvailablePromotions: [{ Id: 3041 }],
  StandardAvailabilityFeeAmount: 0,
};
const DINNER_SLOT = {
  TimeSlot: "2026-10-23T19:30:00",
  IsLeaveTimeRequired: true,
  LeaveTime: "20:30:00",
  ServiceId: 8856,
  HasStandardAvailability: true,
  AvailablePromotions: [],
  StandardAvailabilityFeeAmount: 20,
};
const TIMES = {
  StandardAvailabilityMayRequireCreditCard: false,
  TimeSlots: [LUNCH_SLOT, PROMOTION_SLOT, DINNER_SLOT],
};
const TIMES_WITHOUT_DINNER = { ...TIMES, TimeSlots: [LUNCH_SLOT] };
const LATE_SLOT = {
  TimeSlot: "2026-10-23T00:15:00.0000000",
  IsLeaveTimeRequired: true,
  LeaveTime: "01:15:00",
  ServiceId: 8856,
  HasStandardAvailability: true,
  AvailablePromotions: [],
  StandardAvailabilityFeeAmount: 0,
};
const TIMES_WITH_LATE = {
  ...TIMES,
  TimeSlots: [LUNCH_SLOT, DINNER_SLOT, LATE_SLOT],
};

const HOLD_REPLY = {
  BookingId: 425742,
  BookingReference: "B9GXWPLY",
  ExpiryTimestamp: "2026-10-15T08:05:00.4343581Z",
};
const RESDIARY_CLOCK = { date: "Thu, 15 Oct 2026 08:00:00 GMT" };

const GUEST_REPLY = {
  CustomerId: 604935,
  WasExistingCustomer: true,
  IsCustomerBlocked: false,
  Booking: {
    BookingId: 425742,
    Reference: "B9GXWPLY",
    VisitDate: "2026-10-23",
    VisitTime: "19:30",
    PartySize: 2,
  },
  PaymentAmount: 0,
  FormattedPaymentAmount: "€0.00",
  StripePublishableKey: null,
  StripeAccountId: null,
  PaymentIntentSecret: null,
  SetupIntentClientSecret: null,
  PaymentProviderType: null,
  GuestPayHostedPageUrl: null,
  Errors: null,
};
const STRIPE_REPLY = {
  StripePublishableKey: "pk_test_fixture",
  StripeAccountId: "acct_fixture",
  PaymentProviderType: "Stripe",
};
const SERVER_ERROR = reply(500, {
  Message: "An unexpected error has occurred (id: 7d64c386).",
  ValidationErrors: null,
  ApiRequestId: "2516102546915854596_90ca0217_api-account@example.test",
});

function holdStatus(status: string): THandler {
  return reply(200, {
    Status: status,
    Booking: { Reference: "B9GXWPLY", BookingId: 425742 },
  });
}

const ROUTES = {
  signIn: "POST /api/Jwt/v2/Authenticate",
  setup: "GET /Setup",
  closedDates: "GET /ClosedDates",
  search: "POST /AvailabilitySearch",
  hold: "POST /CreateTableHold",
  move: "PUT /UpdateTableHoldBookingDetails",
  guest: "PUT /UpdateTableHoldWithCustomer",
  status: "GET /TableHoldBookingStatus/425742",
} as const;

function peploes(overrides: Record<string, THandler | THandler[]> = {}) {
  const fake = fakeResDiary({
    [ROUTES.signIn]: SIGNED_IN,
    [ROUTES.setup]: reply(200, SETUP),
    [ROUTES.closedDates]: reply(200, CLOSED_DATES),
    [ROUTES.search]: reply(200, TIMES),
    [ROUTES.hold]: reply(200, HOLD_REPLY, RESDIARY_CLOCK),
    [ROUTES.move]: reply(200, { ExpiryTimestamp: HOLD_REPLY.ExpiryTimestamp }),
    [ROUTES.guest]: reply(200, { ...GUEST_REPLY, Status: "Success" }),
    [ROUTES.status]: holdStatus("Pending"),
    ...overrides,
  });
  const provider = createResDiaryProvider({
    config: CONFIG,
    fetch: fake.fetch,
  });
  const bookings = createBookingService({ provider, holdSecret: HOLD_SECRET });
  return { fake, bookings };
}

const DETAILS = {
  firstName: "Test",
  surname: "Guest",
  email: "guest@example.test",
  mobileCountryCode: "+353",
  mobile: "087 123 4567",
  specialRequests: "Window seat please",
  termsAccepted: true,
};

async function chooseTime(
  bookings: ReturnType<typeof peploes>["bookings"],
  time: string,
) {
  const page = (await bookings.getFindTableData())._unsafeUnwrap();
  const times = (
    await bookings.getTimes({ date: FRIDAY, partySize: "2" })
  )._unsafeUnwrap();
  const chosen = times.times.find((candidate) => candidate.time === time);
  const [offer] = chosen?.offers ?? [];
  if (!(chosen && offer)) {
    throw new Error(`The grid does not offer ${time}`);
  }
  const hold = await bookings.holdTable(
    {
      searchDate: chosen.searchDate,
      time: chosen.time,
      partySize: 2,
      offer: { kind: offer.kind },
    },
    ALLOW_HOLDS,
  );
  return { page, times, hold };
}

async function confirm(
  bookings: ReturnType<typeof peploes>["bookings"],
  time: string,
) {
  const { hold } = await chooseTime(bookings, time);
  const { holdToken, summary } = hold._unsafeUnwrap();
  const result = await bookings.submitGuestDetails(
    {
      ...DETAILS,
      holdReference: summary.reference,
      holdRevision: summary.revision,
    },
    holdToken,
  );
  return { holdToken, result };
}

function logged(): string {
  return JSON.stringify([
    vi.mocked(console.log).mock.calls,
    vi.mocked(console.warn).mock.calls,
    vi.mocked(console.error).mock.calls,
  ]);
}

describe("a guest books a table", function journeyTests() {
  it("finds a table, picks lunch, holds it and books it with no deposit", async function booksLunch() {
    const { bookings } = peploes();

    const { page, times, hold } = await chooseTime(bookings, "12:30");
    const { holdToken, summary, expiresInMs, cookieMaxAgeSeconds } =
      hold._unsafeUnwrap();
    const booked = await bookings.submitGuestDetails(
      {
        ...DETAILS,
        holdReference: summary.reference,
        holdRevision: summary.revision,
      },
      holdToken,
    );

    expect(page).toEqual({
      partySize: { min: 1, max: 7, default: 2 },
      calendar: {
        today: "2026-10-15",
        lastDate: "2027-10-15",
        defaultDate: "2026-10-15",
        closedWeekdays: [1],
        closedPeriods: [],
      },
      terms: [
        expect.stringContaining("valid credit card"),
        expect.stringContaining("Refundable deposits"),
      ],
    });
    expect(times.times.map((time) => [time.time, time.label])).toEqual([
      ["12:30", "12:30 pm"],
      ["19:30", "7:30 pm"],
    ]);
    expect(expiresInMs).toBe(299_434);
    expect(cookieMaxAgeSeconds).toBe(1200);
    expect(summary).toEqual({
      reference: "B9GXWPLY",
      date: FRIDAY,
      dateLabel: "Fri, 23 Oct 2026",
      time: "12:30",
      timeLabel: "12:30 pm",
      partySize: 2,
      guestsLabel: "2 guests",
      offer: {
        kind: "standard",
        feeCents: 0,
        mayRequireCard: false,
        returnBy: {
          time: "14:00",
          label: "2:00 pm",
          nextDay: false,
          required: false,
        },
      },
      revision: 1,
    });
    expect(booked._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: "B9GXWPLY",
      summary,
    });
  });

  it("moves the one hold when the guest picks another time, then books it there", async function movesThenBooks() {
    const { fake, bookings } = peploes();
    const { hold } = await chooseTime(bookings, "19:30");
    const first = hold._unsafeUnwrap();

    const moved = (
      await bookings.holdTable(
        {
          searchDate: FRIDAY,
          time: "12:30",
          partySize: 2,
          offer: { kind: "standard" },
        },
        ALLOW_HOLDS,
        first.holdToken,
      )
    )._unsafeUnwrap();
    const booked = await bookings.submitGuestDetails(
      {
        ...DETAILS,
        holdReference: moved.summary.reference,
        holdRevision: moved.summary.revision,
      },
      moved.holdToken,
    );

    expect(booked._unsafeUnwrap()).toMatchObject({
      kind: "confirmed",
      summary: { timeLabel: "12:30 pm", revision: 2 },
    });
    expect(fake.count(ROUTES.hold)).toBe(1);
    expect(fake.bodies(ROUTES.move)).toEqual([
      {
        BookingId: 425742,
        VisitDate: FRIDAY,
        VisitTime: "12:30:00",
        PartySize: 2,
        ChannelCode: "ONLINE",
      },
    ]);
    expect(fake.bodies(ROUTES.guest)).toEqual([
      expect.objectContaining({ BookingId: 425742 }),
    ]);
  });

  it("sends ResDiary the hold and the cleaned details on the wire", async function sendsWire() {
    const { fake, bookings } = peploes();

    await confirm(bookings, "12:30");

    expect(fake.bodies(ROUTES.hold)).toEqual([
      {
        VisitDate: FRIDAY,
        VisitTime: "12:30:00",
        PartySize: 2,
        ChannelCode: "ONLINE",
      },
    ]);
    expect(fake.bodies(ROUTES.guest)).toEqual([
      {
        BookingId: 425742,
        Customer: {
          FirstName: "Test",
          Surname: "Guest",
          Email: "guest@example.test",
          Mobile: "871234567",
          MobileCountryCode: 353,
        },
        SpecialRequests: "Window seat please",
        RedirectUrl: "http://localhost:3000/book-a-table",
        CancelUrl: "http://localhost:3000/book-a-table",
      },
    ]);
  });

  it("makes the ResDiary calls the plan counts for one booking", async function countsCalls() {
    const { fake, bookings } = peploes();

    await confirm(bookings, "12:30");

    expect({
      signIn: fake.count(ROUTES.signIn),
      setup: fake.count(ROUTES.setup),
      closedDates: fake.count(ROUTES.closedDates),
      search: fake.count(ROUTES.search),
      hold: fake.count(ROUTES.hold),
      guest: fake.count(ROUTES.guest),
      status: fake.count(ROUTES.status),
    }).toEqual({
      signIn: 1,
      setup: 2,
      closedDates: 1,
      search: 2,
      hold: 1,
      guest: 1,
      status: 0,
    });
  });

  it("takes a €20 dinner deposit, then reports the booking once Stripe has paid", async function takesDeposit() {
    const { fake, bookings } = peploes({
      [ROUTES.guest]: reply(200, {
        ...GUEST_REPLY,
        ...STRIPE_REPLY,
        Status: "PaymentRequired",
        PaymentAmount: 20,
        FormattedPaymentAmount: "€20.00",
        PaymentIntentSecret: "pi_fixture_secret_never_logged",
      }),
      [ROUTES.status]: [holdStatus("Pending"), holdStatus("Confirmed")],
    });

    const { holdToken, result } = await confirm(bookings, "19:30");
    const firstPoll = await bookings.getHoldStatus(HOLD_QUERY, holdToken);
    vi.setSystemTime(NOW.getTime() + 2000);
    const secondPoll = await bookings.getHoldStatus(HOLD_QUERY, holdToken);

    expect(result._unsafeUnwrap()).toEqual({
      holdCookie: {
        token: expect.any(String),
        maxAgeSeconds: expect.any(Number),
      },
      kind: "payment",
      amountCents: 2000,
      amountText: "€20.00",
      stripe: {
        publishableKey: "pk_test_fixture",
        accountId: "acct_fixture",
        clientSecret: "pi_fixture_secret_never_logged",
      },
      summary: expect.objectContaining({
        timeLabel: "7:30 pm",
        offer: {
          kind: "standard",
          feeCents: 2000,
          mayRequireCard: false,
          returnBy: {
            time: "20:30",
            label: "8:30 pm",
            nextDay: false,
            required: true,
          },
        },
      }),
    });
    expect(firstPoll._unsafeUnwrap()).toMatchObject({
      status: "pending",
      clearHold: false,
    });
    expect(secondPoll._unsafeUnwrap()).toMatchObject({
      status: "confirmed",
      reference: "B9GXWPLY",
      clearHold: true,
      summary: expect.objectContaining({ dateLabel: "Fri, 23 Oct 2026" }),
    });
    expect(fake.count(ROUTES.status)).toBe(2);
    expect(logged()).not.toContain("pi_fixture_secret_never_logged");
  });

  it("asks for a card to be saved when ResDiary wants a guarantee", async function savesCard() {
    const { bookings } = peploes({
      [ROUTES.guest]: reply(200, {
        ...GUEST_REPLY,
        ...STRIPE_REPLY,
        Status: "CreditCardRequired",
        SetupIntentClientSecret: "seti_fixture_secret_never_logged",
      }),
    });

    const { result } = await confirm(bookings, "19:30");

    expect(result._unsafeUnwrap()).toEqual({
      holdCookie: {
        token: expect.any(String),
        maxAgeSeconds: expect.any(Number),
      },
      kind: "card",
      amountText: "€0.00",
      stripe: {
        publishableKey: "pk_test_fixture",
        accountId: "acct_fixture",
        clientSecret: "seti_fixture_secret_never_logged",
      },
      summary: expect.objectContaining({ reference: "B9GXWPLY" }),
    });
    expect(logged()).not.toContain("seti_fixture_secret_never_logged");
  });

  it("tells the guest the time has gone when another guest took it between search and hold", async function tableTaken() {
    const { fake, bookings } = peploes({
      [ROUTES.search]: [
        reply(200, TIMES),
        reply(200, TIMES),
        reply(200, TIMES_WITHOUT_DINNER),
      ],
      [ROUTES.hold]: SERVER_ERROR,
    });

    const { hold } = await chooseTime(bookings, "19:30");

    expect(hold._unsafeUnwrapErr()).toMatchObject({
      code: ErrorCode.Conflict,
      message: "That time is no longer available. Please choose another.",
    });
    expect(fake.count(ROUTES.hold)).toBe(1);
    expect(fake.count(ROUTES.search)).toBe(3);
    expect(fake.count(ROUTES.guest)).toBe(0);
  });

  it("settles a lost guest-details reply from the hold status", async function lostReplyConfirmed() {
    const { fake, bookings } = peploes({
      [ROUTES.guest]: SERVER_ERROR,
      [ROUTES.status]: holdStatus("Confirmed"),
    });

    const { result } = await confirm(bookings, "12:30");

    expect(result._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: "B9GXWPLY",
      summary: expect.objectContaining({ timeLabel: "12:30 pm" }),
    });
    expect(fake.count(ROUTES.guest)).toBe(1);
    expect(fake.count(ROUTES.status)).toBe(1);
  });

  it("sends the same details once more when the hold is still pending after a lost reply", async function lostReplyResent() {
    const { fake, bookings } = peploes({
      [ROUTES.guest]: [
        SERVER_ERROR,
        reply(200, { ...GUEST_REPLY, Status: "Success" }),
      ],
      [ROUTES.status]: holdStatus("Pending"),
    });

    const { result } = await confirm(bookings, "12:30");

    expect(result._unsafeUnwrap()).toMatchObject({ kind: "confirmed" });
    const [first, second] = fake.bodies(ROUTES.guest);
    expect(fake.count(ROUTES.guest)).toBe(2);
    expect(second).toEqual(first);
  });

  it("lists a time after midnight last and holds it on the evening ResDiary dated it", async function afterMidnight() {
    const { fake, bookings } = peploes({
      [ROUTES.search]: reply(200, TIMES_WITH_LATE),
    });

    const { times, hold } = await chooseTime(bookings, "00:15");

    expect(times.times.at(-1)).toMatchObject({
      searchDate: FRIDAY,
      date: "2026-10-24",
      time: "00:15",
      label: "12:15 am (next day)",
    });
    expect(fake.bodies(ROUTES.hold).at(-1)).toMatchObject({
      VisitDate: FRIDAY,
      VisitTime: "00:15:00",
    });
    expect(hold._unsafeUnwrap().summary).toMatchObject({
      dateLabel: "Sat, 24 Oct 2026",
      timeLabel: "12:15 am",
    });
  });

  it("logs one error, with the hold id, when ResDiary cannot find the hold for the details", async function oneDiagnostic() {
    const { bookings } = peploes({ [ROUTES.guest]: reply(404) });

    const { result } = await confirm(bookings, "12:30");

    expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.HoldExpired);
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).toContain(
      '\\"holdId\\":425742',
    );
  });
});
