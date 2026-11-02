import { ok } from "neverthrow";
import { afterEach, beforeEach, vi } from "vitest";

import type {
  IResDiaryClosedDates,
  IResDiaryDateRange,
  IResDiaryRules,
  IResDiarySlot,
  IResDiaryTimes,
  TBookingProvider,
} from "@/lib/types";
import { createBookingService } from "@/services/bookings";

export const HOLD_SECRET = "test-only-hold-secret-0123456789abcdef";

export const NOW = new Date("2026-10-15T08:00:00Z");

export const SANDBOX_TERMS_HTML =
  '<p>\n\t<span style="color: rgb(22, 22, 22); font-family: &quot;Open Sans&quot;, sans-serif; font-size: 16px; white-space-collapse: preserve-breaks;">Please note we may require a valid credit card number to confirm bookings. Unless we specifically refer to a &quot;refundable deposit&quot;, we do <strong>NOT</strong> charge anything to the credit card unless there is a &quot;no show&quot; of which we have no prior notice. </span></p>\n<p>\n\t<span style="color: rgb(22, 22, 22); font-family: &quot;Open Sans&quot;, sans-serif; font-size: 16px; white-space-collapse: preserve-breaks;">Refundable deposits are credited in full to your account balance on payment on departure.</span></p>\n';

export const RULES: IResDiaryRules = {
  minPartySize: 1,
  maxPartySize: 7,
  defaultPartySize: 2,
  maxDaysAhead: 365,
  services: [
    { id: 8855, name: "Lunch", start: "12:00" },
    { id: 8856, name: "Dinner", start: "18:00" },
  ],
  currency: "EUR",
  termsHtml: SANDBOX_TERMS_HTML,
  privacyHtml: "",
  noAvailability: { message: null, phone: null },
  membership: null,
  customField: null,
  stripe: null,
  paymentProvider: "stripe",
};

export const CLOSED: IResDiaryClosedDates = {
  closedWeekdays: [1],
  closedPeriods: [],
};

export const FRIDAY = "2026-10-23";

export const HOLD = {
  holdId: 425742,
  reference: "B9GXWPLY",
  expiresAt: NOW.getTime() + 300_000,
  expiresInMs: 298_200,
};

export function slot(
  time: string,
  changes: Partial<IResDiarySlot> = {},
): IResDiarySlot {
  return {
    date: FRIDAY,
    time,
    serviceId: 8855,
    standard: true,
    feeCents: 0,
    leaveTimeRequired: false,
    leaveTime: null,
    ...changes,
  };
}

export const TIMES: IResDiaryTimes = {
  mayRequireCard: false,
  slots: [
    slot("12:30", { leaveTime: { time: "14:00", nextDay: false } }),
    slot("18:30", { serviceId: 8856, standard: false }),
    slot("19:30", {
      serviceId: 8856,
      feeCents: 2000,
      leaveTimeRequired: true,
      leaveTime: { time: "20:30", nextDay: false },
    }),
  ],
};

export function fakeProvider(
  rules: Partial<IResDiaryRules> = {},
  closed: Partial<IResDiaryClosedDates> = {},
) {
  return {
    getRules: vi.fn<TBookingProvider["getRules"]>(function rulesReply() {
      return Promise.resolve(ok({ ...RULES, ...rules }));
    }),
    getClosedDates: vi.fn<TBookingProvider["getClosedDates"]>(
      function closedReply() {
        return Promise.resolve(ok({ ...CLOSED, ...closed }));
      },
    ),
    searchTimes: vi.fn<TBookingProvider["searchTimes"]>(function timesReply() {
      return Promise.resolve(ok(TIMES));
    }),
    createHold: vi.fn<TBookingProvider["createHold"]>(function holdReply() {
      return Promise.resolve(ok(HOLD));
    }),
    changeHold: vi.fn<TBookingProvider["changeHold"]>(function moveReply() {
      return Promise.resolve(ok({ expiresAt: HOLD.expiresAt }));
    }),
    getHoldStatus: vi.fn<TBookingProvider["getHoldStatus"]>(
      function statusReply() {
        return Promise.resolve(
          ok({ status: "pending", reference: HOLD.reference }),
        );
      },
    ),
    getAvailableDates: vi.fn<TBookingProvider["getAvailableDates"]>(
      function rangeReply() {
        return Promise.resolve(ok(openDays(NOVEMBER_OPEN)));
      },
    ),
    submitHoldGuest: vi.fn<TBookingProvider["submitHoldGuest"]>(
      function guestReply() {
        return Promise.resolve(
          ok({ kind: "confirmed", reference: HOLD.reference }),
        );
      },
    ),
  };
}

export const DINNER = {
  searchDate: FRIDAY,
  time: "19:30",
  partySize: 2,
  offer: { kind: "standard" },
};

export const LUNCH = { ...DINNER, time: "12:30" };

export function openDays(dates: string[]): IResDiaryDateRange {
  return {
    dates: dates.map((date) => ({
      date,
      times: [{ time: "19:30", nextDay: false }],
    })),
    missing: null,
  };
}

export const NOVEMBER_OPEN = ["2026-11-03", "2026-11-04", "2026-11-06"];

export function searching(slots: IResDiarySlot[], mayRequireCard = false) {
  const provider = fakeProvider();
  provider.searchTimes.mockResolvedValue(ok({ mayRequireCard, slots }));
  return provider;
}

export function rulesOn(
  provider: ReturnType<typeof fakeProvider>,
  date: string,
  rules: Partial<IResDiaryRules>,
) {
  provider.getRules.mockImplementation(function rulesFor(day) {
    return Promise.resolve(ok({ ...RULES, ...(day === date ? rules : {}) }));
  });
}

export function rulesReadFor(
  provider: ReturnType<typeof fakeProvider>,
  date: string,
): boolean {
  return provider.getRules.mock.calls.some(([day]) => day === date);
}

export const GUEST_DETAILS = {
  holdReference: "B9GXWPLY",
  holdRevision: 1,
  firstName: "Test",
  surname: "Guest",
  email: "guest@example.test",
  mobileCountryCode: "+353",
  mobile: "087 123 4567",
  specialRequests: "Window seat please",
  termsAccepted: true,
};

export const STRIPE_STEP = {
  publishableKey: "pk_test_fixture",
  accountId: "acct_fixture",
  clientSecret: "pi_fixture_secret_never_logged",
};

export const HOLD_QUERY = { holdReference: HOLD.reference, holdRevision: 1 };

export const ALLOW_HOLDS = () => Promise.resolve(true);

export function service(provider: TBookingProvider = fakeProvider()) {
  return createBookingService({ provider, holdSecret: HOLD_SECRET });
}

export function errorLogs(): string {
  return JSON.stringify(vi.mocked(console.error).mock.calls);
}

export function setUpBookingTests() {
  beforeEach(function useFakeClock() {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, "log").mockImplementation(function silence() {});
    vi.spyOn(console, "warn").mockImplementation(function silence() {});
    vi.spyOn(console, "error").mockImplementation(function silence() {});
  });

  afterEach(function useRealClock() {
    vi.useRealTimers();
  });
}
