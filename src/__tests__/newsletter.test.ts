import { ok } from "neverthrow";
import { beforeEach, expect, it, vi } from "vitest";
import { requestNewsletterSubscription } from "@/lib/newsletter-provider";
import { subscribeNewsletter } from "@/services/newsletter";

vi.mock("@/lib/newsletter-provider", () => ({
  requestNewsletterSubscription: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());
it("rejects invalid email without contacting the mailing provider", async () => {
  const result = await subscribeNewsletter({ email: "invalid" });
  expect(result.isErr()).toBe(true);
  expect(requestNewsletterSubscription).not.toHaveBeenCalled();
});

it("trims and normalizes an email before requesting subscription", async () => {
  vi.mocked(requestNewsletterSubscription).mockResolvedValue(ok(undefined));
  const result = await subscribeNewsletter(
    { email: "  Guest@Example.test  " },
    "127.0.0.1",
  );
  expect(result.isOk()).toBe(true);
  expect(requestNewsletterSubscription).toHaveBeenCalledWith(
    "guest@example.test",
    "127.0.0.1",
  );
});
