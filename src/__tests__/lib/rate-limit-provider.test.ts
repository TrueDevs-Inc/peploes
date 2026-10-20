import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createHoldLimiter } from "@/lib/rate-limit-provider";
import type { IRateLimitWindow } from "@/lib/types";

const SECRET = "test-hold-secret-with-32-characters!";
const GUEST_IP = "203.0.113.7";

function memoryWindow(holds: number) {
  const used = new Map<string, number>();
  return {
    limit: vi.fn(function limit(visitor: string) {
      const count = (used.get(visitor) ?? 0) + 1;
      if (count > holds) {
        return Promise.resolve({ success: false });
      }
      used.set(visitor, count);
      return Promise.resolve({ success: true });
    }),
  } satisfies IRateLimitWindow;
}

function limiter(...windows: IRateLimitWindow[]) {
  return createHoldLimiter({ windows, secret: SECRET });
}

beforeEach(function silenceLogs() {
  vi.spyOn(console, "warn").mockImplementation(function silence() {});
  vi.spyOn(console, "error").mockImplementation(function silence() {});
});

afterEach(function restoreLogs() {
  vi.restoreAllMocks();
});

describe("the hold limit", function holdLimitTests() {
  it("allows two holds from one visitor and refuses the third, with a warning that leaves out the IP", async function refusesThird() {
    const allowHold = limiter(memoryWindow(2), memoryWindow(5));

    const answers = [
      await allowHold(GUEST_IP),
      await allowHold(GUEST_IP),
      await allowHold(GUEST_IP),
    ];

    expect(answers).toEqual([true, true, false]);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(console.warn).mock.calls[0])).not.toContain(
      GUEST_IP,
    );
  });

  it("refuses once any window is used up, for that visitor only", async function anyWindow() {
    const allowHold = limiter(memoryWindow(5), memoryWindow(1));

    await allowHold(GUEST_IP);

    expect(await allowHold(GUEST_IP)).toBe(false);
    expect(await allowHold("198.51.100.20")).toBe(true);
  });

  it("stops at the first window that refuses, so a refused click costs the guest nothing", async function stopsAtRefusal() {
    const longer = memoryWindow(5);
    const allowHold = limiter(memoryWindow(1), longer);

    await allowHold(GUEST_IP);
    await allowHold(GUEST_IP);
    await allowHold(GUEST_IP);

    expect(longer.limit).toHaveBeenCalledTimes(1);
  });

  it("sends Upstash a key made with our secret, never the IP", async function hidesIp() {
    const window = memoryWindow(2);
    const otherSecretWindow = memoryWindow(2);

    await limiter(window)(GUEST_IP);
    await createHoldLimiter({
      windows: [otherSecretWindow],
      secret: "another-secret-with-32-characters!!",
    })(GUEST_IP);

    const [key] = window.limit.mock.calls[0];
    expect(key).not.toContain(GUEST_IP);
    expect(key).not.toBe(otherSecretWindow.limit.mock.calls[0][0]);
  });

  it.each([
    ["the first x-forwarded-for entry", "203.0.113.7, 10.0.0.1", GUEST_IP],
    ["one IPv6 /64 network", "2001:db8:1:2::1", "2001:0DB8:1:2:aaaa::5"],
    ["an IPv4 address written as IPv6", "::ffff:203.0.113.7", GUEST_IP],
    ["the full IPv4-in-IPv6 form", "0:0:0:0:0:FFFF:203.0.113.7", GUEST_IP],
    ["the hex IPv4-in-IPv6 form", "::ffff:cb00:7107", GUEST_IP],
  ])(
    "counts %s as the visitor",
    async function sameVisitor(_case, first, second) {
      const allowHold = limiter(memoryWindow(1));

      await allowHold(first);

      expect(await allowHold(second)).toBe(false);
    },
  );

  it("counts another IPv6 /64 network as another visitor", async function otherNetwork() {
    const allowHold = limiter(memoryWindow(1));

    await allowHold("2001:db8:1:2::1");

    expect(await allowHold("2001:db8:1:3::1")).toBe(true);
  });

  describe("when it cannot check, it lets the hold through", function failOpenTests() {
    it("warns once when Upstash is not configured", async function notConfigured() {
      const allowHold = createHoldLimiter(null);

      const answers = [
        await allowHold(GUEST_IP),
        await allowHold(GUEST_IP),
        await allowHold(GUEST_IP),
      ];

      expect(answers).toEqual([true, true, true]);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("logs an error when Upstash fails", async function upstashFails() {
      const allowHold = limiter({
        limit: vi.fn().mockRejectedValue(new Error("fetch failed")),
      });

      expect(await allowHold(GUEST_IP)).toBe(true);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("logs an error when Upstash answers too slowly", async function upstashSlow() {
      const allowHold = limiter({
        limit: vi.fn().mockResolvedValue({ success: true, reason: "timeout" }),
      });

      expect(await allowHold(GUEST_IP)).toBe(true);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it("still refuses when a later window is used up", async function slowThenRefused() {
      const allowHold = limiter(
        {
          limit: vi
            .fn()
            .mockResolvedValue({ success: true, reason: "timeout" }),
        },
        memoryWindow(0),
      );

      expect(await allowHold(GUEST_IP)).toBe(false);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it.each([
      ["no header", null],
      ["an empty header", " "],
    ])(
      "logs an error, without asking Upstash, for %s",
      async function noIp(_case, forwardedFor) {
        const window = memoryWindow(1);
        const allowHold = limiter(window);

        expect(await allowHold(forwardedFor)).toBe(true);
        expect(await allowHold(forwardedFor)).toBe(true);
        expect(window.limit).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledTimes(2);
      },
    );
  });
});

describe("the site's hold limit", function siteLimitTests() {
  afterEach(function resetEnv() {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function siteLimiter() {
    vi.resetModules();
    const { allowHold } = await import("@/lib/rate-limit-provider");
    return allowHold;
  }

  it("is off, with one warning, until Upstash is configured", async function offByDefault() {
    const allowHold = await siteLimiter();

    expect(await allowHold(GUEST_IP)).toBe(true);
    expect(await allowHold(GUEST_IP)).toBe(true);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  function configureUpstash() {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://limits.example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.stubEnv("BOOKING_HOLD_SECRET", SECRET);
  }

  it("asks the configured Upstash for 5 holds in 5 minutes, then 10 in 10", async function usesUpstash() {
    configureUpstash();
    const upstash = vi.fn(function answer(url: string, init: RequestInit) {
      const reply = (command: unknown) => ({
        result: JSON.stringify(command).includes(":10m:") ? [-1, 10] : [4, 5],
      });
      const body: unknown[] = JSON.parse(String(init.body));
      return Promise.resolve(
        Response.json(
          url.endsWith("/pipeline") ? body.map(reply) : reply(body),
        ),
      );
    });
    vi.stubGlobal("fetch", upstash);
    const allowHold = await siteLimiter();

    expect(await allowHold(GUEST_IP)).toBe(false);

    const hosts = upstash.mock.calls.map(([url]) => new URL(url).host);
    const sent = upstash.mock.calls.map(([, init]) => init.body).join();
    expect(new Set(hosts)).toEqual(new Set(["limits.example.upstash.io"]));
    expect(sent).toMatch(/"peploes:holds:5m:[^"]+",5,\d+,300000,/);
    expect(sent).toMatch(/"peploes:holds:10m:[^"]+",10,\d+,600000,/);
    expect(sent).not.toContain(GUEST_IP);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("hashes the visitor with a key of its own, not the hold-cookie secret itself", async function ownVisitorKey() {
    configureUpstash();
    const upstash = vi.fn(function answer(url: string, init: RequestInit) {
      const body: unknown[] = JSON.parse(String(init.body));
      const reply = () => ({ result: [4, 5] });
      return Promise.resolve(
        Response.json(url.endsWith("/pipeline") ? body.map(reply) : reply()),
      );
    });
    vi.stubGlobal("fetch", upstash);
    const allowHold = await siteLimiter();

    await allowHold(GUEST_IP);

    const sent = upstash.mock.calls.map(([, init]) => init.body).join();
    const withCookieSecret = createHmac("sha256", SECRET)
      .update(`peploes:holds:${GUEST_IP}`)
      .digest("base64url");
    expect(sent).toMatch(/"peploes:holds:5m:[^"]+"/);
    expect(sent).not.toContain(withCookieSecret);
  });

  it("logs Upstash's own error when it cannot be reached, within its time limit", async function unreachable() {
    configureUpstash();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );
    const allowHold = await siteLimiter();

    expect(await allowHold(GUEST_IP)).toBe(true);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(console.error).mock.calls[0])).toContain(
      "fetch failed",
    );
  });
});
