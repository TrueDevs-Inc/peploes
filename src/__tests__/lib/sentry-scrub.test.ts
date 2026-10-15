import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubSpan } from "@/lib/sentry-scrub";

describe("Sentry URL scrubbing", function sentryScrubTests() {
  it("drops the query and fragment Sentry keeps beside a fetch breadcrumb", function scrubsBreadcrumb() {
    const breadcrumb = scrubBreadcrumb({
      category: "http",
      data: {
        url: "https://api.example.test/api/Booking/B9GX",
        "http.method": "GET",
        "http.query": "?authenticationToken=guest-token",
        "http.fragment": "#top",
        status_code: 200,
      },
    });

    expect(breadcrumb.data).toEqual({
      url: "https://api.example.test/api/Booking/B9GX",
      "http.method": "GET",
      status_code: 200,
    });
  });

  it("removes queries from span URLs and descriptions", function scrubsSpan() {
    const span = scrubSpan({
      span_id: "a",
      trace_id: "b",
      start_timestamp: 1,
      description:
        "GET https://api.example.test/api/Booking/B9GX?authenticationToken=guest-token",
      data: {
        "url.full":
          "https://api.example.test/api/Booking/B9GX?authenticationToken=guest-token",
        "url.query": "authenticationToken=guest-token",
        "http.request.method": "GET",
      },
    });

    expect(JSON.stringify(span)).not.toContain("guest-token");
    expect(span.data["url.full"]).toBe(
      "https://api.example.test/api/Booking/B9GX",
    );
    expect(span.data["http.request.method"]).toBe("GET");
  });
});
