import { beforeEach, expect, it, vi } from "vitest";
import { requestNewsletterSubscription } from "@/lib/newsletter-provider";

const subscriberEmail = "guest@example.test";
const visitorIp = "127.0.0.1";

const state = vi.hoisted(() => ({
  limit: vi.fn(),
  env: {
    KLAVIYO_PRIVATE_KEY: "synthetic-key",
    KLAVIYO_LIST_ID_NEWSLETTER: "synthetic-list",
    NEWSLETTER_RATE_LIMIT_SECRET: "synthetic-secret",
    UPSTASH_REDIS_REST_URL: "https://redis.example.test",
    UPSTASH_REDIS_REST_TOKEN: "synthetic-token",
  },
}));
vi.mock("@/lib/env", () => ({ env: state.env }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn();
    limit = state.limit;
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
  state.limit.mockResolvedValue({ success: true });
});
it("submits consent to the configured list and safely repeats the same address", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 202 }));
  expect(
    (await requestNewsletterSubscription(subscriberEmail, visitorIp)).isOk(),
  ).toBe(true);
  expect(
    (await requestNewsletterSubscription(subscriberEmail, visitorIp)).isOk(),
  ).toBe(true);
  const payload = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
  expect(payload.data.relationships.list.data.id).toBe("synthetic-list");
  expect(payload.data.attributes.profiles.data[0].attributes).toEqual({
    email: subscriberEmail,
    subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
  });
});
it("never reports rejected or uncertain jobs as accepted", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 429 }));
  expect(
    (await requestNewsletterSubscription(subscriberEmail, visitorIp)).isErr(),
  ).toBe(true);
  fetcher.mockRejectedValue(new Error("timeout"));
  const result = await requestNewsletterSubscription(
    subscriberEmail,
    visitorIp,
  );
  expect(result.isErr() && result.error.code).toBe("OUTCOME_UNKNOWN");
});
it("fails closed when configuration or abuse protection is unavailable", async () => {
  const fetcher = vi.spyOn(globalThis, "fetch");
  expect(
    (await requestNewsletterSubscription(subscriberEmail, null)).isErr(),
  ).toBe(true);
  state.limit.mockResolvedValue({ success: true, reason: "timeout" });
  expect(
    (await requestNewsletterSubscription(subscriberEmail, visitorIp)).isErr(),
  ).toBe(true);
  state.limit.mockResolvedValue({ success: false });
  expect(
    (await requestNewsletterSubscription(subscriberEmail, visitorIp)).isErr(),
  ).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});

it("uses one quota identity for rotated addresses on the same IPv6 network", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(null, { status: 202 }),
  );
  await requestNewsletterSubscription(subscriberEmail, "2001:db8:abcd:1::1");
  await requestNewsletterSubscription(subscriberEmail, "2001:db8:abcd:1::2");
  expect(state.limit.mock.calls.at(-1)?.[0]).toBe(
    state.limit.mock.calls.at(-2)?.[0],
  );
});
