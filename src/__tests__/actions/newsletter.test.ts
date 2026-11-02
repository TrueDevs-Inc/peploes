import { err, ok } from "neverthrow";
import { beforeEach, expect, it, vi } from "vitest";
import { submitNewsletter } from "@/actions/newsletter";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import { subscribeNewsletter } from "@/services/newsletter";

vi.mock("next/headers", () => ({
  headers: vi
    .fn()
    .mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));
vi.mock("@/services/newsletter", () => ({ subscribeNewsletter: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());
it("shows concise thanks only after the provider accepts the subscription request", async () => {
  vi.mocked(subscribeNewsletter).mockResolvedValue(ok(undefined));
  expect(await submitNewsletter({ email: "guest@example.test" })).toEqual({
    accepted: true,
    message: "Thanks for signing up.",
  });
});
it("preserves a failed subscription outcome without showing thanks", async () => {
  vi.mocked(subscribeNewsletter).mockResolvedValue(
    err(createError(ErrorCode.ServiceUnavailable, "Signup unavailable")),
  );
  expect(await submitNewsletter({ email: "guest@example.test" })).toEqual({
    accepted: false,
    message: "Signup unavailable",
  });
});
it("does not show thanks for an unexpected failure", async () => {
  vi.mocked(subscribeNewsletter).mockRejectedValue(
    new Error("synthetic failure"),
  );
  expect(await submitNewsletter({ email: "guest@example.test" })).toEqual({
    accepted: false,
    message: "Unable to complete the request.",
  });
});
