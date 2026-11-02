import { beforeEach, describe, expect, it, vi } from "vitest";

import { allowEnquiry } from "@/lib/enquiry-rate-limit";

const limiter = vi.hoisted(() => ({ limit: vi.fn() }));
const settings = vi.hoisted(() => ({
  EMAIL_RATE_LIMIT_SECRET: "synthetic-secret-long-enough-for-hmac",
  UPSTASH_REDIS_REST_URL: "https://redis.example.test",
  UPSTASH_REDIS_REST_TOKEN: "synthetic-token",
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    limit = limiter.limit;
  },
}));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@/lib/env", () => ({ env: settings }));

beforeEach(() => {
  limiter.limit.mockReset();
  settings.EMAIL_RATE_LIMIT_SECRET = "synthetic-secret-long-enough-for-hmac";
});

describe("private dining enquiry limit", () => {
  it("requires a trusted visitor address", async () => {
    expect(await allowEnquiry(null)).toBe(false);
    expect(limiter.limit).not.toHaveBeenCalled();
  });

  it("fails closed when Redis cannot confirm the limit", async () => {
    limiter.limit.mockRejectedValue(new Error("private Redis error"));
    expect(await allowEnquiry("192.0.2.10")).toBe(false);
  });

  it("allows a visitor only when the limit confirms capacity", async () => {
    limiter.limit
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    expect(await allowEnquiry("192.0.2.10")).toBe(true);
    expect(await allowEnquiry("192.0.2.10")).toBe(false);
  });
});
