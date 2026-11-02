import { err, ok, ResultAsync } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

import type {
  claimEmailDelivery,
  finishEmailDelivery,
} from "@/dal/email-deliveries";
import { selectEmailProvider } from "@/lib/email-provider";
import { renderEnquiryAdmin } from "@/lib/email-templates";
import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createError } from "@/lib/errors";
import type {
  IEmailDelivery,
  IEmailMessage,
  IEmailTransportMessage,
  TEmailProviderOutcome,
} from "@/lib/types";
import { createEmailDeliveryService } from "@/services/email";

vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));

const MESSAGE: IEmailMessage = {
  notificationId: "00000000-0000-4000-8000-000000000001",
  template: "enquiry-admin",
  version: 1,
  to: ["restaurant@example.test"],
  subject: "New enquiry",
  html: "<p>Enquiry</p>",
  text: "Enquiry",
};

function fixture(
  flag: string | undefined = "true",
  live = true,
  stagingAllowlist: string | undefined = live
    ? undefined
    : "restaurant@example.test,reply@example.test",
  claimFails = false,
) {
  const records = new Map<string, IEmailDelivery>();
  const smtp = vi.fn<
    (message: IEmailTransportMessage) => Promise<TEmailProviderOutcome>
  >(async () => ({ status: "accepted", providerId: "smtp-1" }));
  const resend = vi.fn<
    (message: IEmailTransportMessage) => Promise<TEmailProviderOutcome>
  >(async () => ({ status: "accepted", providerId: "resend-1" }));
  const claim: typeof claimEmailDelivery = (input) => {
    if (claimFails)
      return ResultAsync.fromSafePromise(Promise.resolve()).andThen(() =>
        err(createError(ErrorCode.DatabaseError, "private database detail")),
      );
    const current = records.get(input.id);
    if (current) {
      if (
        current.status === "rejected" &&
        current.payloadHash === input.payloadHash
      ) {
        const retried = { ...current, status: "pending" as const };
        records.set(input.id, retried);
        return ResultAsync.fromSafePromise(
          Promise.resolve({ claimed: true as const, record: retried }),
        );
      }
      return ResultAsync.fromSafePromise(
        Promise.resolve({ claimed: false as const, record: current }),
      );
    }
    const record: IEmailDelivery = {
      ...input,
      status: "pending",
      providerId: null,
    };
    records.set(input.id, record);
    return ResultAsync.fromSafePromise(
      Promise.resolve({ claimed: true as const, record }),
    );
  };
  const finish: typeof finishEmailDelivery = (input) => {
    const current = records.get(input.id);
    if (current) {
      records.set(input.id, {
        ...current,
        status: input.status,
        providerId: input.providerId ?? null,
      });
    }
    return ResultAsync.fromSafePromise(Promise.resolve(Boolean(current)));
  };
  const send = createEmailDeliveryService({
    claim,
    finish,
    smtp,
    resend,
    providerFlag: flag,
    stagingAllowlist,
    live,
    identity: () =>
      ok({
        from: "Peploe's <sender@example.test>",
        replyTo: "reply@example.test",
      }),
  });
  return { send, smtp, resend, records };
}

describe("transactional email delivery", () => {
  it.each([
    [undefined, "smtp"],
    ["true", "smtp"],
    ["false", "resend"],
  ] as const)("selects %s as %s", (flag, expected) => {
    expect(selectEmailProvider(flag)._unsafeUnwrap()).toBe(expected);
  });

  it("rejects an invalid provider flag before sending", async () => {
    const { send, smtp, resend } = fixture("yes");
    const result = await send(MESSAGE);
    expect(result.isErr()).toBe(true);
    expect(smtp).not.toHaveBeenCalled();
    expect(resend).not.toHaveBeenCalled();
    expect(logToSentry).toHaveBeenCalledWith(
      new Error("Email configuration invalid"),
      expect.any(Object),
    );
  });

  it.each([
    ["true", "smtp", "resend"],
    ["false", "resend", "smtp"],
  ] as const)(
    "sends with only the %s selected provider",
    async (flag, selected, other) => {
      const fixtureResult = fixture(flag);
      const result = await fixtureResult.send(MESSAGE);
      expect(result._unsafeUnwrap().provider).toBe(selected);
      expect(fixtureResult[selected]).toHaveBeenCalledOnce();
      expect(fixtureResult[other]).not.toHaveBeenCalled();
    },
  );

  it.each(["rejected", "unknown"] as const)(
    "never calls Resend when SMTP is %s",
    async (status) => {
      const { send, smtp, resend } = fixture();
      smtp.mockResolvedValue({ status, reason: "smtp_outcome_unknown" });
      const first = await send(MESSAGE);
      const second = await send(MESSAGE);
      expect(first.isErr()).toBe(true);
      expect(second.isErr()).toBe(true);
      expect(resend).not.toHaveBeenCalled();
      expect(smtp).toHaveBeenCalledTimes(status === "rejected" ? 2 : 1);
    },
  );

  it("never calls SMTP when selected Resend rejects a message", async () => {
    const { send, smtp, resend } = fixture("false");
    resend.mockResolvedValue({
      status: "rejected",
      reason: "resend_rejected",
    });
    expect((await send(MESSAGE)).isErr()).toBe(true);
    expect(resend).toHaveBeenCalledOnce();
    expect(smtp).not.toHaveBeenCalled();
  });

  it("never calls SMTP when selected Resend outcome is unknown", async () => {
    const { send, smtp, resend } = fixture("false");
    resend.mockResolvedValue({
      status: "unknown",
      reason: "resend_outcome_unknown",
    });
    expect((await send(MESSAGE)).isErr()).toBe(true);
    expect((await send(MESSAGE)).isErr()).toBe(true);
    expect(resend).toHaveBeenCalledOnce();
    expect(smtp).not.toHaveBeenCalled();
  });

  it("reports a failed delivery claim without exposing database details or sending mail", async () => {
    const { send, smtp, resend } = fixture("true", true, undefined, true);
    expect((await send(MESSAGE)).isErr()).toBe(true);
    expect(logToSentry).toHaveBeenCalledWith(
      new Error("Email delivery claim failed"),
      expect.objectContaining({
        tags: expect.objectContaining({ template: "enquiry-admin" }),
      }),
    );
    expect(JSON.stringify(vi.mocked(logToSentry).mock.calls)).not.toContain(
      "private database detail",
    );
    expect(smtp).not.toHaveBeenCalled();
    expect(resend).not.toHaveBeenCalled();
  });

  it("returns an accepted result without replaying a retry", async () => {
    const { send, smtp, resend } = fixture();
    await send(MESSAGE);
    const retry = await send(MESSAGE);
    expect(retry._unsafeUnwrap().status).toBe("accepted");
    expect(smtp).toHaveBeenCalledOnce();
    expect(resend).not.toHaveBeenCalled();
  });

  it("does not send concurrently for the same notification", async () => {
    const { send, smtp } = fixture();
    let release: ((value: TEmailProviderOutcome) => void) | undefined;
    smtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = send(MESSAGE);
    const competing = await send(MESSAGE);
    expect(competing.isErr()).toBe(true);
    expect(smtp).toHaveBeenCalledOnce();
    release?.({ status: "accepted", providerId: "smtp-1" });
    expect((await first)._unsafeUnwrap().status).toBe("accepted");
  });

  it.each(["to", "cc", "bcc"] as const)(
    "blocks an unapproved staging %s recipient before a provider call",
    async (field) => {
      const { send, smtp, resend } = fixture("true", false);
      const result = await send({
        ...MESSAGE,
        [field]: ["unapproved@example.test"],
      });
      expect(result.isErr()).toBe(true);
      expect(smtp).not.toHaveBeenCalled();
      expect(resend).not.toHaveBeenCalled();
    },
  );

  it("enforces the configured allowlist on a Vercel production deployment", async () => {
    const { send, smtp, resend } = fixture(
      "true",
      true,
      "restaurant@example.test,reply@example.test",
    );
    expect(
      (await send({ ...MESSAGE, to: ["unapproved@example.test"] })).isErr(),
    ).toBe(true);
    expect(smtp).not.toHaveBeenCalled();
    expect(resend).not.toHaveBeenCalled();
    expect(
      (await send({ ...MESSAGE, replyTo: "guest@example.test" })).isOk(),
    ).toBe(true);
    expect(smtp.mock.calls[0]?.[0]).toMatchObject({
      replyTo: "reply@example.test",
      subject: "[STAGING] New enquiry",
    });
  });

  it("uses the approved Reply-To for staging", async () => {
    const { send, smtp } = fixture("true", false);
    const result = await send({ ...MESSAGE, replyTo: "guest@example.test" });
    expect(result.isOk()).toBe(true);
    expect(smtp.mock.calls[0]?.[0].replyTo).toBe("reply@example.test");
    expect(smtp.mock.calls[0]?.[0].subject).toBe("[STAGING] New enquiry");
  });
});

describe("enquiry template", () => {
  it("escapes guest content in HTML while retaining plain text", () => {
    const rendered = renderEnquiryAdmin(
      {
        notificationId: MESSAGE.notificationId,
        date: "2027-06-18",
        guests: 12,
        name: "Example Guest",
        email: "guest@example.test",
        message: '<script>alert("hi")</script>',
        consent: false,
      },
      "restaurant@example.test",
      "contact@example.test",
    );
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.text).toContain('<script>alert("hi")</script>');
  });
});
