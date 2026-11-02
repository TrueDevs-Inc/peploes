import { afterEach, describe, expect, it, vi } from "vitest";

import { sendResend, sendSmtp } from "@/lib/email-provider";
import type { IEmailTransportMessage } from "@/lib/types";

const transport = vi.hoisted(() => ({
  sendMail: vi.fn(),
  close: vi.fn(),
}));

const settings = vi.hoisted(() => ({
  EMAIL_FROM_ADDRESS: "sender@example.test",
  EMAIL_SMTP_HOST: "smtp.example.test",
  EMAIL_SMTP_PORT: 465,
  EMAIL_SMTP_AUTH_METHOD: "app-password",
  EMAIL_SMTP_USERNAME: "sender@example.test",
  EMAIL_SMTP_PASSWORD: "synthetic-password",
  EMAIL_RESEND_API_KEY: "synthetic-key",
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => transport) },
}));
vi.mock("@/lib/env", () => ({ env: settings }));

const MESSAGE: IEmailTransportMessage = {
  id: "a".repeat(64),
  from: "Peploe's <sender@example.test>",
  to: ["guest@example.test"],
  cc: [],
  bcc: [],
  replyTo: "reply@example.test",
  subject: "Test enquiry",
  html: "<p>Test</p>",
  text: "Test",
};

afterEach(() => {
  transport.sendMail.mockReset();
  transport.close.mockReset();
  settings.EMAIL_SMTP_PASSWORD = "synthetic-password";
  settings.EMAIL_RESEND_API_KEY = "synthetic-key";
  vi.unstubAllGlobals();
});

describe("SMTP adapter", () => {
  it("records full SMTP acceptance", async () => {
    transport.sendMail.mockResolvedValue({
      accepted: ["guest@example.test"],
      rejected: [],
      messageId: "smtp-message-id",
    });
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "accepted",
      providerId: "smtp-message-id",
    });
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: `<${MESSAGE.id}@example.test>` }),
    );
    expect(transport.close).toHaveBeenCalledOnce();
  });

  it("treats partial SMTP acceptance as unknown", async () => {
    transport.sendMail.mockResolvedValue({
      accepted: ["guest@example.test"],
      rejected: ["other@example.test"],
      messageId: "smtp-message-id",
    });
    expect(await sendSmtp({ ...MESSAGE, cc: ["other@example.test"] })).toEqual({
      status: "unknown",
      reason: "partial_smtp_acceptance",
      providerId: "smtp-message-id",
    });
  });

  it("marks authentication failure as definitely rejected", async () => {
    transport.sendMail.mockRejectedValue(
      Object.assign(new Error("private auth detail"), { code: "EAUTH" }),
    );
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "rejected",
      reason: "smtp_authentication",
    });
  });

  it("marks an SMTP rejection before DATA as definitely unsent", async () => {
    transport.sendMail.mockRejectedValue(
      Object.assign(new Error("private envelope detail"), {
        command: "RCPT TO",
      }),
    );
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "rejected",
      reason: "smtp_before_data",
    });
  });

  it("marks an explicit SMTP DATA refusal as rejected", async () => {
    transport.sendMail.mockRejectedValue(
      Object.assign(new Error("private server reply"), {
        code: "EMESSAGE",
        command: "DATA",
        responseCode: 550,
      }),
    );
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "rejected",
      reason: "smtp_explicit_rejection",
    });
  });

  it("leaves an SMTP timeout outcome unknown", async () => {
    transport.sendMail.mockRejectedValue(new Error("private timeout detail"));
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "unknown",
      reason: "smtp_outcome_unknown",
    });
  });

  it("fails before submission when selected SMTP credentials are absent", async () => {
    settings.EMAIL_SMTP_PASSWORD = "";
    expect(await sendSmtp(MESSAGE)).toEqual({
      status: "rejected",
      reason: "missing_smtp_credentials",
    });
    expect(transport.sendMail).not.toHaveBeenCalled();
  });
});

describe("Resend adapter", () => {
  it("fails before submission when selected Resend credentials are absent", async () => {
    settings.EMAIL_RESEND_API_KEY = "";
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    expect(await sendResend(MESSAGE)).toEqual({
      status: "rejected",
      reason: "missing_resend_configuration",
    });
    expect(request).not.toHaveBeenCalled();
  });
  it("uses its stable idempotency key and returns provider acceptance", async () => {
    const request = vi.fn(
      async (_url: string, _options: RequestInit) =>
        new Response(JSON.stringify({ id: "resend-message-id" }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", request);
    expect(await sendResend(MESSAGE)).toEqual({
      status: "accepted",
      providerId: "resend-message-id",
    });
    expect(request.mock.calls[0]?.[0]).toBe("https://api.resend.com/emails");
    expect(
      new Headers(request.mock.calls[0]?.[1].headers).get("Idempotency-Key"),
    ).toBe(MESSAGE.id);
  });

  it("leaves a lost acknowledgement unknown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private token")),
    );
    expect(await sendResend(MESSAGE)).toEqual({
      status: "unknown",
      reason: "resend_outcome_unknown",
    });
  });
});
