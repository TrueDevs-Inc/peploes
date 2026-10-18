import * as Sentry from "@sentry/nextjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetcher } from "@/helpers/api";
import { HttpVerb } from "@/lib/enums";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("fetcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { body: false, serialized: "false" },
    { body: 0, serialized: "0" },
    { body: "", serialized: '""' },
    { body: null, serialized: "null" },
    { body: { name: "Example" }, serialized: '{"name":"Example"}' },
  ])(
    "sends the supplied JSON body: $serialized",
    async ({ body, serialized }) => {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ saved: true }));
      vi.stubGlobal("fetch", request);

      const result = await fetcher({
        url: "/api/bookings/times",
        method: HttpVerb.Post,
        body,
      });

      expect(request).toHaveBeenCalledWith(
        "/api/bookings/times",
        expect.objectContaining({
          body: serialized,
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(result).toEqual({
        ok: true,
        status: 200,
        data: { saved: true },
        error: null,
      });
    },
  );

  it("omits the body and JSON header when no body is supplied", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", request);

    const result = await fetcher({
      url: "/api/bookings/times",
      method: HttpVerb.Get,
    });

    expect(request).toHaveBeenCalledWith(
      "/api/bookings/times",
      expect.objectContaining({ body: undefined, headers: {} }),
    );
    expect(result).toEqual({ ok: true, status: 204, data: null, error: null });
  });

  it("returns a server's public JSON error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ error: "Invalid example name." }, { status: 422 }),
        ),
    );

    const result = await fetcher({
      url: "/api/bookings/times",
      method: HttpVerb.Get,
    });

    expect(result).toMatchObject({
      ok: false,
      status: 422,
      error: "Invalid example name.",
    });
  });

  it("uses the HTTP status text when an error is not a string", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            { error: { code: "UNAVAILABLE" } },
            { status: 503, statusText: "Service Unavailable" },
          ),
        ),
    );

    const result = await fetcher({
      url: "/api/bookings/times",
      method: HttpVerb.Get,
    });

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      error: "Service Unavailable",
    });
  });

  it("captures a network failure and returns an unsuccessful result", async () => {
    const error = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(error));

    const result = await fetcher({
      url: "/api/bookings/times",
      method: HttpVerb.Get,
    });

    expect(result).toEqual({
      ok: false,
      status: 0,
      data: null,
      error: "Failed to fetch",
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
