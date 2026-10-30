import { describe, expect, it } from "vitest";

import {
  sanitizeAnalyticsEvent,
  sanitizeCampaignValue,
  sanitizeUrlPart,
} from "@/lib/analytics/sanitize";

describe("campaign values", () => {
  it.each(["newsletter", "spring launch", "summer-2026_promo"])(
    "keeps a safe value: %s",
    (value) => {
      expect(sanitizeCampaignValue(value)).toBe(value);
    },
  );

  it.each([
    "jane.doe@example.com",
    "call 353 1 234 5678",
    "+353861234567",
    "<script>",
    "",
    "a".repeat(65),
    42,
    null,
  ])("rejects an unsafe value: %s", (value) => {
    expect(sanitizeCampaignValue(value)).toBeUndefined();
  });
});

describe("paths and referrers", () => {
  it("reduces a URL to origin and path", () => {
    expect(
      sanitizeUrlPart(
        "path",
        "https://peploes.test/menus/dinner?email=a@b.co&x=1#frag",
      ),
    ).toBe("/menus/dinner");
  });

  it("drops credentials, malformed URLs and personal-looking paths", () => {
    expect(sanitizeUrlPart("path", "https://user:pw@peploes.test/a")).toBe(
      "/a",
    );
    expect(sanitizeUrlPart("path", "http://[bad")).toBeUndefined();
    expect(
      sanitizeUrlPart("path", "https://peploes.test/u/jane@example.com"),
    ).toBeUndefined();
  });

  it("reduces a referrer to its origin", () => {
    expect(
      sanitizeUrlPart("referrer", "https://www.google.com/search?q=jane@x.com"),
    ).toBe("https://www.google.com");
    expect(sanitizeUrlPart("referrer", "")).toBeUndefined();
    expect(sanitizeUrlPart("referrer", "not a url")).toBeUndefined();
  });
});

describe("event allowlist", () => {
  it("rejects unknown events", () => {
    expect(sanitizeAnalyticsEvent("purchase", { value: 10 })).toBeNull();
    expect(sanitizeAnalyticsEvent("booking_complete", {})).toBeNull();
  });

  it("keeps only allowlisted properties", () => {
    expect(
      sanitizeAnalyticsEvent("booking_click", {
        placement: "hero",
        email: "jane@example.com",
        href: "tel:+353861234567",
      }),
    ).toEqual({ name: "booking_click", params: { placement: "hero" } });
  });

  it("drops an interaction whose identifier is outside the closed set", () => {
    expect(
      sanitizeAnalyticsEvent("contact_click", {
        placement: "hero",
        destination: "tel:+353861234567",
      }),
    ).toBeNull();
    expect(sanitizeAnalyticsEvent("menu_view", { menu: "secret" })).toBeNull();
  });

  it("strips query, hash and referrer path from page views", () => {
    expect(
      sanitizeAnalyticsEvent("page_view", {
        page_location: "https://peploes.test/menus?token=abc#x",
        page_path: "https://peploes.test/menus?token=abc#x",
        page_referrer: "https://news.test/story?id=7",
        page_title: "Jane Doe",
      }),
    ).toEqual({
      name: "page_view",
      params: {
        page_location: "https://peploes.test/menus",
        page_path: "/menus",
        page_referrer: "https://news.test",
      },
    });
  });

  it("keeps safe campaign values and drops a UTM containing an email", () => {
    expect(
      sanitizeAnalyticsEvent("menu_view", {
        menu: "dinner",
        utm_source: "newsletter",
        utm_campaign: "jane.doe@example.com",
        utm_other: "x",
      }),
    ).toEqual({
      name: "menu_view",
      params: { menu: "dinner", utm_source: "newsletter" },
    });
  });
});

describe("encoded email in a path", () => {
  it.each([
    ["single", "/book/jane%40example.com"],
    ["double", "/book/jane%2540example.com"],
    ["triple", "/book/jane%252540example.com"],
    ["encoded dot and at", "/book/jane%252540example%252Ecom"],
    ["malformed escape", "/book/%E0%A4%A"],
  ])("rejects a %s-encoded address", (_label, path) => {
    expect(sanitizeUrlPart("path", path)).toBeUndefined();
    expect(
      sanitizeUrlPart("url", `https://peploes.test${path}`),
    ).toBeUndefined();
  });

  it("rejects an escape chain deeper than the decode limit", () => {
    const deep = `/a/${"%25".repeat(12)}40`;
    expect(sanitizeUrlPart("path", deep)).toBeUndefined();
  });

  it("keeps an ordinary encoded path", () => {
    expect(sanitizeUrlPart("path", "/menus/caf%C3%A9")).toBe(
      "/menus/caf%C3%A9",
    );
  });
});
