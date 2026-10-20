import { err, ok } from "neverthrow";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALLOW_HOLDS,
  DINNER,
  errorLogs,
  fakeProvider,
  GUEST_DETAILS,
  HOLD,
  HOLD_SECRET,
  LUNCH,
  NOW,
  RULES,
  STRIPE_STEP,
  service,
  setUpBookingTests,
} from "@/__tests__/services/bookings/fixtures";
import { readHold, signHold } from "@/lib/booking-token";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import type {
  IResDiaryRules,
  THoldToken,
  TResDiaryFailure,
  TResDiaryGuestOutcome,
} from "@/lib/types";
import { createBookingService } from "@/services/bookings";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

setUpBookingTests();

afterEach(function resetEnv() {
  vi.unstubAllEnvs();
});

const SUMMARY = {
  reference: "B9GXWPLY",
  date: "2026-10-23",
  dateLabel: "Fri, 23 Oct 2026",
  time: "19:30",
  timeLabel: "7:30 pm",
  partySize: 2,
  guestsLabel: "2 guests",
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
  revision: 1,
};

async function held(provider = fakeProvider()) {
  const hold = await service(provider).holdTable(DINNER, ALLOW_HOLDS);
  return { provider, token: hold._unsafeUnwrap().holdToken };
}

function answered(outcome: TResDiaryGuestOutcome) {
  return ok<TResDiaryGuestOutcome, TResDiaryFailure>(outcome);
}

function failed(failure: TResDiaryFailure) {
  return err<TResDiaryGuestOutcome, TResDiaryFailure>(failure);
}

function unclear(): TResDiaryFailure {
  return { kind: "outcome_unknown", operation: "submitHoldGuest" };
}

function logged(): string {
  return JSON.stringify([
    vi.mocked(console.log).mock.calls,
    vi.mocked(console.warn).mock.calls,
    vi.mocked(console.error).mock.calls,
  ]);
}

describe("submitGuestDetails", function submitGuestDetailsTests() {
  it("books the table and sends ResDiary the cleaned details", async function confirms() {
    const { provider, token } = await held();

    const result = await service(provider).submitGuestDetails(
      GUEST_DETAILS,
      token,
    );

    expect(result._unsafeUnwrap()).toEqual({
      kind: "confirmed",
      reference: "B9GXWPLY",
      summary: SUMMARY,
    });
    expect(provider.submitHoldGuest).toHaveBeenCalledWith(
      {
        holdId: 425742,
        guest: {
          firstName: "Test",
          surname: "Guest",
          email: "guest@example.test",
          mobile: "871234567",
          mobileCountryCode: 353,
        },
        specialRequests: "Window seat please",
        returnUrl: "http://localhost:3000/book-a-table",
        cancelUrl: "http://localhost:3000/book-a-table",
      },
      { deadlineAt: NOW.getTime() + 9000 },
    );
  });

  it("leaves out blank special requests", async function blankRequests() {
    const { provider, token } = await held();

    await service(provider).submitGuestDetails(
      { ...GUEST_DETAILS, specialRequests: "  " },
      token,
    );

    expect(provider.submitHoldGuest.mock.calls[0]?.[0].specialRequests).toBe(
      undefined,
    );
  });

  it("sends special requests as text, whatever they hold, and never logs them", async function requestsAsText() {
    const { provider, token } = await held();
    const specialRequests = "<b>Call me on 087 123 4567</b> & nothing else";
    provider.submitHoldGuest.mockResolvedValue(err(unclear()));

    await service(provider).submitGuestDetails(
      { ...GUEST_DETAILS, specialRequests },
      token,
    );

    expect(provider.submitHoldGuest.mock.calls[0]?.[0].specialRequests).toBe(
      specialRequests,
    );
    expect(logged()).toContain("B9GXWPLY");
    expect(logged()).not.toContain("Call me");
  });

  it.each([
    [
      "a deposit",
      {
        kind: "payment",
        amountCents: 2000,
        amountText: "€20.00",
        stripe: STRIPE_STEP,
      },
    ],
    [
      "a saved card",
      { kind: "card", amountText: "€0.00", stripe: STRIPE_STEP },
    ],
  ] as const)(
    "hands the browser the Stripe step for %s",
    async function stripeStep(_case, outcome) {
      const { provider, token } = await held();
      provider.submitHoldGuest.mockResolvedValue(ok(outcome));

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrap()).toEqual({
        ...outcome,
        summary: SUMMARY,
        holdCookie: { token: expect.any(String), maxAgeSeconds: 1199 },
      });
      expect(logged()).not.toContain(STRIPE_STEP.clientSecret);
    },
  );

  describe("ResDiary's other answers", function answerTests() {
    it.each([
      [
        "the table was taken",
        answered({ kind: "table_taken" }),
        ErrorCode.Conflict,
        "That time is no longer available. Please choose another.",
      ],
      [
        "the guest is blocked",
        answered({ kind: "guest_blocked" }),
        ErrorCode.Forbidden,
        "Please contact us to make this booking.",
      ],
      [
        "a payment we cannot take",
        failed({
          kind: "payment_unsupported",
          operation: "submitHoldGuest",
        }),
        ErrorCode.ServiceUnavailable,
        undefined,
      ],
      [
        "a refusal naming fields",
        failed({
          kind: "rejected",
          operation: "submitHoldGuest",
          fields: ["Customer.Email"],
        }),
        ErrorCode.ValidationError,
        "Please check your details.",
      ],
      [
        "a refusal naming no fields",
        failed({
          kind: "rejected",
          operation: "submitHoldGuest",
          fields: [],
        }),
        ErrorCode.ServiceUnavailable,
        undefined,
      ],
      [
        "a failure before sending",
        failed({
          kind: "unavailable",
          operation: "submitHoldGuest",
          detail: "network",
        }),
        ErrorCode.ServiceUnavailable,
        undefined,
      ],
      [
        "a 404, which may also mean a moved endpoint",
        failed({ kind: "not_found", operation: "submitHoldGuest" }),
        ErrorCode.HoldExpired,
        "Your table hold ran out. Please choose a time again.",
      ],
    ])(
      "maps %s without logging it again",
      async function maps(_case, reply, code, message) {
        const { provider, token } = await held();
        provider.submitHoldGuest.mockResolvedValue(reply);

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        const error = result._unsafeUnwrapErr();
        expect(error.code).toBe(code);
        if (message) {
          expect(error.message).toBe(message);
        }
        expect(console.error).not.toHaveBeenCalled();
      },
    );
  });

  describe("whether the hold cookie is still any use", function clearHoldTests() {
    type TProvider = ReturnType<typeof fakeProvider>;
    const nothing = (_provider: TProvider) => undefined;

    it.each([
      [
        "ResDiary gave the table away",
        (provider: TProvider) =>
          provider.submitHoldGuest.mockResolvedValue(
            answered({ kind: "table_taken" }),
          ),
        {},
        (token: string) => token,
        true,
      ],
      [
        "the guest is blocked",
        (provider: TProvider) =>
          provider.submitHoldGuest.mockResolvedValue(
            answered({ kind: "guest_blocked" }),
          ),
        {},
        (token: string) => token,
        true,
      ],
      [
        "ResDiary cannot find the hold",
        (provider: TProvider) =>
          provider.submitHoldGuest.mockResolvedValue(
            failed({ kind: "not_found", operation: "submitHoldGuest" }),
          ),
        {},
        (token: string) => token,
        true,
      ],
      [
        "the hold ran out",
        (_provider: TProvider) => vi.setSystemTime(NOW.getTime() + 300_000),
        {},
        (token: string) => token,
        true,
      ],
      [
        "the cookie cannot be read",
        nothing,
        {},
        (token: string) =>
          `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`,
        true,
      ],
      [
        "the form is from another tab",
        nothing,
        { holdReference: "BOTHERTAB" },
        (token: string) => token,
        false,
      ],
      [
        "the details break a rule",
        nothing,
        { email: "not-an-email" },
        (token: string) => token,
        false,
      ],
      [
        "ResDiary could not be reached",
        (provider: TProvider) =>
          provider.submitHoldGuest.mockResolvedValue(
            failed({
              kind: "unavailable",
              operation: "submitHoldGuest",
              detail: "network",
            }),
          ),
        {},
        (token: string) => token,
        false,
      ],
    ])(
      "says so when %s",
      async function clearHold(_case, arrange, change, cookie, gone) {
        const { provider, token } = await held();
        arrange(provider);

        const result = await service(provider).submitGuestDetails(
          { ...GUEST_DETAILS, ...change },
          cookie(token),
        );

        expect(result._unsafeUnwrapErr().clearHold ?? false).toBe(gone);
      },
    );
  });

  describe("marking a hold whose details were sent", function detailsSentTests() {
    type TProvider = ReturnType<typeof fakeProvider>;
    const keepsCookie: Array<[string, (provider: TProvider) => void]> = [
      [
        "a deposit step",
        (provider) =>
          provider.submitHoldGuest.mockResolvedValue(
            answered({
              kind: "payment",
              amountCents: 2000,
              amountText: "€20.00",
              stripe: STRIPE_STEP,
            }),
          ),
      ],
      [
        "a card step",
        (provider) =>
          provider.submitHoldGuest.mockResolvedValue(
            answered({
              kind: "card",
              amountText: "€0.00",
              stripe: STRIPE_STEP,
            }),
          ),
      ],
      [
        "ResDiary refusing a field",
        (provider) =>
          provider.submitHoldGuest.mockResolvedValue(
            failed({
              kind: "rejected",
              operation: "submitHoldGuest",
              fields: ["Customer.Email"],
            }),
          ),
      ],
      [
        "an unclear outcome",
        (provider) =>
          provider.submitHoldGuest.mockResolvedValue(err(unclear())),
      ],
    ];

    it.each(keepsCookie)(
      "hands back a cookie marked as sent after %s, which a change of time then never moves",
      async function marksSent(_case, arrange) {
        const { provider, token } = await held();
        arrange(provider);

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        const holdCookie = result.isOk()
          ? "holdCookie" in result.value
            ? result.value.holdCookie
            : undefined
          : result.error.holdCookie;
        expect(holdCookie?.maxAgeSeconds).toBe(1199);
        expect(readHold(holdCookie?.token ?? "", HOLD_SECRET)).toMatchObject({
          holdId: HOLD.holdId,
          rev: 1,
          detailsSent: true,
        });
        const again = await service(provider).holdTable(
          LUNCH,
          ALLOW_HOLDS,
          holdCookie?.token,
        );
        expect(again.isOk()).toBe(true);
        expect(provider.changeHold).not.toHaveBeenCalled();
        expect(provider.createHold).toHaveBeenCalledTimes(2);
      },
    );

    it.each([
      ["a confirmed booking", () => undefined, GUEST_DETAILS],
      [
        "a table ResDiary gave away",
        (provider: TProvider) =>
          provider.submitHoldGuest.mockResolvedValue(
            answered({ kind: "table_taken" }),
          ),
        GUEST_DETAILS,
      ],
      [
        "details refused before sending",
        () => undefined,
        { ...GUEST_DETAILS, email: "x" },
      ],
    ])(
      "hands back no marked cookie for %s",
      async function noMark(_case, arrange, details) {
        const { provider, token } = await held();
        arrange(provider);

        const result = await service(provider).submitGuestDetails(
          details,
          token,
        );

        expect(
          result.isOk()
            ? "holdCookie" in result.value
            : "holdCookie" in result.error,
        ).toBe(false);
      },
    );
  });

  describe("the hold, checked before anything is sent", function holdTests() {
    it.each([
      [
        "no hold cookie",
        undefined,
        {},
        "We couldn't find your table hold. Please choose a time again.",
      ],
      [
        "a hold from another tab",
        "token",
        { holdReference: "BOTHERTAB" },
        "Your booking changed in another tab. Please start again here.",
      ],
      [
        "a hold another tab has since moved",
        "token",
        { holdRevision: 2 },
        "Your booking changed in another tab. Please start again here.",
      ],
    ])(
      "answers not found for %s",
      async function notFound(_case, which, change, message) {
        const { provider, token } = await held();

        const result = await service(provider).submitGuestDetails(
          { ...GUEST_DETAILS, ...change },
          which ? token : undefined,
        );

        expect(result._unsafeUnwrapErr()).toMatchObject({
          code: ErrorCode.NotFound,
          message,
        });
        expect(provider.submitHoldGuest).not.toHaveBeenCalled();
      },
    );

    it("answers not found for a tampered token, with a warning", async function tampered() {
      const { provider, token } = await held();
      const tamperedToken = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        tamperedToken,
      );

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.NotFound);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(provider.submitHoldGuest).not.toHaveBeenCalled();
    });

    it.each([
      [
        "another secret",
        async function foreign() {
          const other = createBookingService({
            provider: fakeProvider(),
            holdSecret: "another-test-only-secret-0123456789abcdef",
          });
          return (await other.holdTable(DINNER, ALLOW_HOLDS))._unsafeUnwrap()
            .holdToken;
        },
      ],
      [
        "a token version this build does not know",
        async function unknownVersion() {
          const { token } = await held();
          const [payload = ""] = token.split(".");
          const hold = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8"),
          ) as THoldToken;
          return signHold(
            { ...hold, v: hold.v + 1 } as THoldToken,
            HOLD_SECRET,
          );
        },
      ],
    ])(
      "answers not found for a token signed with %s, sending nothing",
      async function foreignToken(_case, make) {
        const provider = fakeProvider();
        const token = await make();

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.NotFound);
        expect(provider.submitHoldGuest).not.toHaveBeenCalled();
      },
    );

    it.each([
      ["ran out", 300_000],
      ["has under 5 seconds left", 294_000],
    ])(
      "answers hold expired when the hold %s",
      async function expired(_case, later) {
        const { provider, token } = await held();
        vi.setSystemTime(NOW.getTime() + later);

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        expect(result._unsafeUnwrapErr()).toMatchObject({
          code: ErrorCode.HoldExpired,
          message: "Your table hold ran out. Please choose a time again.",
        });
        expect(provider.submitHoldGuest).not.toHaveBeenCalled();
      },
    );

    it("measures the hold on our clock, so a fast ResDiary clock never ends it early", async function ourClock() {
      const provider = fakeProvider();
      provider.createHold.mockResolvedValue(
        ok({ ...HOLD, expiresAt: NOW.getTime() + 260_000 }),
      );
      const { token } = await held(provider);
      vi.setSystemTime(NOW.getTime() + 270_000);

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result.isOk()).toBe(true);
    });

    it("refuses details that break the field rules, sending nothing", async function invalid() {
      const { provider, token } = await held();

      const result = await service(provider).submitGuestDetails(
        { ...GUEST_DETAILS, firstName: "", termsAccepted: false },
        token,
      );

      expect(result._unsafeUnwrapErr()).toMatchObject({
        code: ErrorCode.ValidationError,
        fieldErrors: {
          firstName: "Please enter your name.",
          termsAccepted: "Please accept the booking terms.",
        },
      });
      expect(provider.submitHoldGuest).not.toHaveBeenCalled();
    });
  });

  describe("the restaurant's form settings", function settingsTests() {
    it.each([
      [
        "a membership id",
        { membership: { label: "Member number", required: true } },
        "membershipId",
      ],
      [
        "a custom field",
        { customField: { label: "Occasion", required: true, type: "text" } },
        "customField",
      ],
    ] satisfies [string, Partial<IResDiaryRules>, string][])(
      "refuses when ResDiary requires %s the form does not collect",
      async function requiredField(_case, rules, setting) {
        const { provider, token } = await held();
        provider.getRules.mockResolvedValue(ok({ ...RULES, ...rules }));

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        expect(result._unsafeUnwrapErr().code).toBe(
          ErrorCode.ServiceUnavailable,
        );
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(errorLogs()).toContain(setting);
        expect(provider.submitHoldGuest).not.toHaveBeenCalled();
      },
    );

    it.each([
      [false, false],
      [true, true],
    ])(
      "on the live site, refuses a Stripe test key (live %s sends: %s)",
      async function stripeKey(live, sends) {
        const { provider, token } = await held();
        provider.getRules.mockResolvedValue(
          ok({
            ...RULES,
            stripe: {
              publishableKey: "pk_fixture",
              accountId: "acct_fixture",
              live,
            },
          }),
        );

        const result = await createBookingService({
          provider,
          holdSecret: "test-only-hold-secret-0123456789abcdef",
          liveSite: true,
        }).submitGuestDetails(GUEST_DETAILS, token);

        expect(result.isOk()).toBe(sends);
        expect(provider.submitHoldGuest).toHaveBeenCalledTimes(sends ? 1 : 0);
      },
    );

    it.each([
      ["a Vercel preview", "preview", true],
      ["Vercel's production", "production", false],
      ["a production build off Vercel", "", false],
    ])(
      "on %s, follows the live site for a Stripe test key",
      async function liveSite(_case, vercelEnv, sends) {
        const { provider, token } = await held();
        provider.getRules.mockResolvedValue(
          ok({
            ...RULES,
            stripe: {
              publishableKey: "pk_test_fixture",
              accountId: "acct_fixture",
              live: false,
            },
          }),
        );
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("VERCEL_ENV", vercelEnv);
        vi.resetModules();
        const { createBookingService: deployedService } = await import(
          "@/services/bookings"
        );

        const result = await deployedService({
          provider,
          holdSecret: HOLD_SECRET,
        }).submitGuestDetails(GUEST_DETAILS, token);

        expect(result.isOk()).toBe(sends);
      },
    );

    it("sends nothing when the settings cannot be read, so their checks never get skipped", async function rulesFail() {
      const { provider, token } = await held();
      provider.getRules.mockResolvedValue(
        err({ kind: "unavailable", operation: "getRules" }),
      );

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
      expect(provider.submitHoldGuest).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("an unclear reply", function unclearTests() {
    it("trusts ResDiary's status when it already confirmed", async function statusConfirmed() {
      const { provider, token } = await held();
      provider.submitHoldGuest.mockResolvedValue(err(unclear()));
      provider.getHoldStatus.mockResolvedValue(
        ok({ status: "confirmed", reference: HOLD.reference }),
      );

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrap()).toMatchObject({
        kind: "confirmed",
        reference: "B9GXWPLY",
      });
      expect(provider.submitHoldGuest).toHaveBeenCalledTimes(1);
    });

    it("sends once more while the hold is still pending, inside the 15 seconds", async function resends() {
      const { provider, token } = await held();
      provider.submitHoldGuest.mockImplementationOnce(function slowSend() {
        vi.setSystemTime(NOW.getTime() + 9000);
        return Promise.resolve(err(unclear()));
      });

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrap().kind).toBe("confirmed");
      expect(provider.getHoldStatus).toHaveBeenCalledWith(425742, {
        deadlineAt: NOW.getTime() + 12_000,
      });
      expect(provider.submitHoldGuest.mock.calls[1]?.[1]).toEqual({
        deadlineAt: NOW.getTime() + 15_000,
      });
    });

    it.each([
      [
        "the resend is unclear too",
        function twiceUnclear(provider: ReturnType<typeof fakeProvider>) {
          provider.submitHoldGuest.mockResolvedValue(err(unclear()));
        },
        ErrorCode.OutcomeUnknown,
      ],
      [
        "ResDiary says the hold failed",
        function failed(provider: ReturnType<typeof fakeProvider>) {
          provider.submitHoldGuest.mockResolvedValue(err(unclear()));
          provider.getHoldStatus.mockResolvedValue(
            ok({ status: "failed", reference: HOLD.reference }),
          );
        },
        ErrorCode.HoldExpired,
      ],
      [
        "the status cannot be read",
        function unreadable(provider: ReturnType<typeof fakeProvider>) {
          provider.submitHoldGuest.mockResolvedValue(err(unclear()));
          provider.getHoldStatus.mockResolvedValue(
            err({ kind: "unavailable", operation: "getHoldStatus" }),
          );
        },
        ErrorCode.OutcomeUnknown,
      ],
    ])("settles when %s", async function settles(_case, arrange, code) {
      const { provider, token } = await held();
      arrange(provider);

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrapErr().code).toBe(code);
    });

    it.each([
      ["under 5 seconds left on the hold", 294_000],
      ["under 3 seconds left of the 15", 12_500],
    ])(
      "does not send again with %s",
      async function noResend(_case, sendEndsAfter) {
        const { provider, token } = await held();
        provider.submitHoldGuest.mockImplementation(function lateSend() {
          vi.setSystemTime(NOW.getTime() + sendEndsAfter);
          return Promise.resolve(err(unclear()));
        });

        const result = await service(provider).submitGuestDetails(
          GUEST_DETAILS,
          token,
        );

        expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.OutcomeUnknown);
        expect(provider.submitHoldGuest).toHaveBeenCalledTimes(1);
      },
    );

    it("never calls an unknown outcome a failure, and logs only the reference", async function stillConfirming() {
      const { provider, token } = await held();
      provider.submitHoldGuest.mockResolvedValue(err(unclear()));

      const result = await service(provider).submitGuestDetails(
        GUEST_DETAILS,
        token,
      );

      expect(result._unsafeUnwrapErr().message).toBe(
        "We're still confirming your booking. You'll get an email when it's confirmed. If nothing arrives within a few minutes, please call us on +353 1 676 3144.",
      );
      expect(logged()).toContain("B9GXWPLY");
      for (const value of [
        "Test",
        "Guest",
        "guest@example.test",
        "871234567",
        "Window seat",
      ]) {
        expect(logged()).not.toContain(value);
      }
    });
  });

  it("answers still confirming when something throws, since a booking may exist", async function unexpectedThrow() {
    const { provider, token } = await held();
    provider.submitHoldGuest.mockRejectedValue(new Error("boom"));

    const result = await service(provider).submitGuestDetails(
      GUEST_DETAILS,
      token,
    );

    expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.OutcomeUnknown);
    expect(logToSentry).toHaveBeenCalledTimes(1);
  });

  it("stays off without the hold secret", async function noHoldSecret() {
    const { provider, token } = await held();

    const result = await createBookingService({
      provider,
      holdSecret: null,
    }).submitGuestDetails(GUEST_DETAILS, token);

    expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.ServiceUnavailable);
  });
});
