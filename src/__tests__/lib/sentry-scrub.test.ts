import { defaultStackParser, NodeClient } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubBreadcrumb, scrubEvent, scrubSpan } from "@/lib/sentry-scrub";

describe("Sentry URL scrubbing", function sentryScrubTests() {
  it("delivers a scrubbed error through a recording transport", async function recordsScrubbedPayload() {
    const envelopes: string[] = [];
    const client = new NodeClient({
      dsn: "https://public@o0.ingest.sentry.io/1",
      environment: "production",
      integrations: [],
      stackParser: defaultStackParser,
      transport: () => ({
        send(envelope) {
          envelopes.push(JSON.stringify(envelope));
          return Promise.resolve({ statusCode: 200 });
        },
        flush: () => Promise.resolve(true),
      }),
      beforeSend: scrubEvent,
    });

    client.captureEvent({
      message: "Synthetic booking failure",
      request: {
        url: "https://example.test/book-a-table?token=guest-token",
        data: { email: "guest@example.test" },
        headers: { cookie: "signed-cookie" },
      },
      breadcrumbs: [
        { category: "console", message: "guest@example.test" },
        {
          category: "navigation",
          data: { to: "/book-a-table?token=guest-token" },
        },
      ],
      tags: { operation: "hold-table" },
    });

    expect(await client.flush(2000)).toBe(true);
    expect(envelopes).toHaveLength(1);
    expect(envelopes[0]).toContain("Synthetic booking failure");
    expect(envelopes[0]).toContain("hold-table");
    expect(envelopes[0]).not.toContain("guest-token");
    expect(envelopes[0]).not.toContain("guest@example.test");
    expect(envelopes[0]).not.toContain("signed-cookie");
    await client.close(2000);
  });
  it("removes booking request data while retaining diagnostic tags", function scrubsEvent() {
    const event = scrubEvent({
      request: {
        url: "https://example.test/book-a-table?token=guest-token#payment",
        headers: { authorization: "Bearer secret" },
        cookies: { hold: "signed-cookie" },
        data: { email: "guest@example.test" },
        query_string: "token=guest-token",
        method: "POST",
      },
      user: { email: "guest@example.test", ip_address: "192.0.2.1" },
      tags: { operation: "hold-table" },
    });

    expect(event.request).toEqual({
      url: "https://example.test/book-a-table",
      method: "POST",
    });
    expect(event.user).toBeUndefined();
    expect(event.tags).toEqual({ operation: "hold-table" });
  });
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
