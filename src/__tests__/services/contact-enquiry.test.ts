import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderContactAdmin } from "@/lib/email-templates";
import { allowEnquiry } from "@/lib/enquiry-rate-limit";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import { deliverContactEnquiry } from "@/services/contact-enquiry";
import { sendEmail } from "@/services/email";

vi.mock("@/lib/enquiry-rate-limit", () => ({
  allowEnquiry: vi.fn(async () => true),
}));
const settings = vi.hoisted(() => ({
  EMAIL_RESTAURANT_TO: "restaurant@example.test",
  EMAIL_REPLY_TO: "reply@example.test",
}));
vi.mock("@/lib/env", () => ({ env: settings }));
vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));
vi.mock("@/services/email", () => ({ sendEmail: vi.fn() }));

const input = {
  notificationId: "00000000-0000-4000-8000-000000000001",
  name: "Example Guest",
  email: "guest@example.test",
  message: "Hello from the contact form.",
  consent: true as const,
};

beforeEach(() => {
  vi.mocked(sendEmail).mockReset();
  vi.mocked(allowEnquiry).mockReset();
  vi.mocked(allowEnquiry).mockResolvedValue(true);
  settings.EMAIL_RESTAURANT_TO = "restaurant@example.test";
});

describe("contact enquiry", () => {
  it("rejects invalid input and spam without sending", async () => {
    expect(
      (await deliverContactEnquiry({ ...input, consent: false }, null)).status,
    ).toBe("error");
    expect(
      (await deliverContactEnquiry({ ...input, website: "spam" }, null)).status,
    ).toBe("error");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends one restaurant notice and reports provider acceptance", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce(
      ok({ id: "notice-id", provider: "smtp", status: "accepted" }),
    );
    const result = await deliverContactEnquiry(input, "192.0.2.10");
    expect(result.status).toBe("success");
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(allowEnquiry).toHaveBeenCalledWith("192.0.2.10");
    const message = vi.mocked(sendEmail).mock.calls[0]?.[0];
    expect(message).toMatchObject({
      template: "contact-admin",
      to: ["restaurant@example.test"],
      replyTo: "guest@example.test",
    });
  });

  it("does not send when the visitor exceeds the rate limit", async () => {
    vi.mocked(allowEnquiry).mockResolvedValueOnce(false);
    const result = await deliverContactEnquiry(input, "192.0.2.10");
    expect(result.status).toBe("error");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not report success for rejected or unknown delivery", async () => {
    vi.mocked(sendEmail)
      .mockResolvedValueOnce(
        err(createError(ErrorCode.ServiceUnavailable, "Rejected")),
      )
      .mockResolvedValueOnce(
        err(createError(ErrorCode.OutcomeUnknown, "Unknown")),
      );
    expect((await deliverContactEnquiry(input, null)).status).toBe("error");
    expect((await deliverContactEnquiry(input, null)).status).toBe("unknown");
  });

  it("escapes guest content in HTML and keeps it in plain text", () => {
    const message = renderContactAdmin(
      { ...input, message: "<script>alert('x')</script>" },
      "restaurant@example.test",
      "reply@example.test",
    );
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.text).toContain("<script>alert('x')</script>");
  });
});
