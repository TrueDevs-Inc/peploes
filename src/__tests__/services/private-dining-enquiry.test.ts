import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@/lib/enums";
import { logToSentry } from "@/lib/error-handler";
import { createError } from "@/lib/errors";
import { sendEmail } from "@/services/email";
import { deliverPrivateDiningEnquiry } from "@/services/private-dining-enquiry";

vi.mock("@/lib/enquiry-rate-limit", () => ({
  allowEnquiry: vi.fn(async () => true),
}));
const settings = vi.hoisted(() => ({
  EMAIL_RESTAURANT_TO: "restaurant@example.test",
  EMAIL_REPLY_TO: "reply@example.test",
  NEXT_PUBLIC_SITE_URL: "https://example.test",
}));
vi.mock("@/lib/env", () => ({ env: settings }));
vi.mock("@/lib/error-handler", () => ({ logToSentry: vi.fn() }));
vi.mock("@/services/email", () => ({ sendEmail: vi.fn() }));

function enquiryInput() {
  return {
    notificationId: "00000000-0000-4000-8000-000000000001",
    occasion: "Wedding",
    date: "2027-06-18",
    guests: "12",
    name: "Example Guest",
    email: "guest@example.test",
    message: "A family gathering.",
    consent: false,
  };
}

beforeEach(() => {
  vi.mocked(sendEmail).mockReset();
  settings.EMAIL_RESTAURANT_TO = "restaurant@example.test";
});

describe("private dining enquiry service", () => {
  it("reports missing restaurant routing without attempting delivery", async () => {
    settings.EMAIL_RESTAURANT_TO = "";
    expect(
      (await deliverPrivateDiningEnquiry(enquiryInput(), "192.0.2.10")).status,
    ).toBe("error");
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logToSentry).toHaveBeenCalledWith(
      new Error("Enquiry email configuration missing"),
      expect.any(Object),
    );
  });

  it("never reports success when the restaurant notification fails", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce(
      err(createError(ErrorCode.ServiceUnavailable, "Email was not sent.")),
    );
    const result = await deliverPrivateDiningEnquiry(
      enquiryInput(),
      "192.0.2.10",
    );
    expect(result.status).toBe("error");
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("keeps restaurant success when the guest acknowledgement fails", async () => {
    vi.mocked(sendEmail)
      .mockResolvedValueOnce(
        ok({ id: "admin-id", provider: "smtp", status: "accepted" }),
      )
      .mockResolvedValueOnce(
        err(createError(ErrorCode.ServiceUnavailable, "Email was not sent.")),
      );
    const result = await deliverPrivateDiningEnquiry(
      enquiryInput(),
      "192.0.2.10",
    );
    expect(result).toMatchObject({
      status: "success",
      guestAcknowledgement: "failed",
    });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendEmail).mock.calls[0]?.[0].template).toBe(
      "enquiry-admin",
    );
    expect(vi.mocked(sendEmail).mock.calls[1]?.[0].template).toBe(
      "enquiry-guest",
    );
  });

  it("does not turn an unexpected guest acknowledgement error into a failed enquiry", async () => {
    vi.mocked(sendEmail)
      .mockResolvedValueOnce(
        ok({ id: "admin-id", provider: "smtp", status: "accepted" }),
      )
      .mockRejectedValueOnce(new Error("private provider detail"));
    const result = await deliverPrivateDiningEnquiry(
      enquiryInput(),
      "192.0.2.10",
    );
    expect(result).toMatchObject({
      status: "success",
      guestAcknowledgement: "failed",
    });
  });
});
