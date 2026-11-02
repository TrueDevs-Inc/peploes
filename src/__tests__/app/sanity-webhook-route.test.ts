import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/sanity/route";
import { SANITY_CONTENT_CACHE_TAG } from "@/lib/constants";

const edges = vi.hoisted(() => ({
  secret: "webhook-secret-for-tests" as string | undefined,
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: edges.revalidateTag }));
vi.mock("@/lib/env", () => ({
  env: {
    SANITY_PROJECT_ID: "testproject",
    SANITY_DATASET: "development",
    SANITY_API_VERSION: "2026-10-06",
    get SANITY_WEBHOOK_SECRET() {
      return edges.secret;
    },
  },
}));

const PUBLISHED = JSON.stringify({ _id: "menus-page", _type: "menusPage" });

function webhookRequest(body: string, signature?: string): Request {
  return new Request("http://localhost/api/webhooks/sanity", {
    method: "POST",
    body,
    headers: signature ? { [SIGNATURE_HEADER_NAME]: signature } : {},
  });
}

async function settleRealIo(): Promise<void> {
  for (let turn = 0; turn < 20; turn++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

async function sign(body: string, secret: string): Promise<string> {
  return await encodeSignatureHeader(body, Date.now(), secret);
}

beforeEach(function resetEdges() {
  edges.secret = "webhook-secret-for-tests";
  edges.revalidateTag.mockReset();
});

describe("Sanity publish webhook", function sanityWebhookTests() {
  it("expires cached CMS content once Sanity's read API has caught up", async function signedTest() {
    const request = webhookRequest(
      PUBLISHED,
      await sign(PUBLISHED, "webhook-secret-for-tests"),
    );
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const pending = POST(request);
      await settleRealIo();
      await vi.advanceTimersByTimeAsync(2999);
      expect(edges.revalidateTag).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      const response = await pending;
      expect(response.status).toBe(200);
      expect(edges.revalidateTag).toHaveBeenCalledWith(
        SANITY_CONTENT_CACHE_TAG,
        { expire: 0 },
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a request signed with another secret", async function wrongSecretTest() {
    const response = await POST(
      webhookRequest(PUBLISHED, await sign(PUBLISHED, "another-secret")),
    );

    expect(response.status).toBe(401);
    expect(edges.revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a body changed after signing", async function tamperedTest() {
    const signature = await sign(PUBLISHED, "webhook-secret-for-tests");
    const response = await POST(
      webhookRequest(PUBLISHED.replace("menusPage", "x"), signature),
    );

    expect(response.status).toBe(401);
    expect(edges.revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects an unsigned or malformed request", async function unsignedTest() {
    for (const signature of [undefined, "t=1,v1=nope"]) {
      const response = await POST(webhookRequest(PUBLISHED, signature));
      expect(response.status).toBe(401);
    }
    expect(edges.revalidateTag).not.toHaveBeenCalled();
  });

  it("keeps the cache when the request body cannot be read", async function unreadableBodyTest() {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      body,
      duplex: "half",
      headers: {
        [SIGNATURE_HEADER_NAME]: await sign(
          PUBLISHED,
          "webhook-secret-for-tests",
        ),
      },
    };
    const response = await POST(
      new Request("http://localhost/api/webhooks/sanity", init),
    );

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("connection reset");
    expect(edges.revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses updates until a secret is configured", async function noSecretTest() {
    edges.secret = undefined;
    const response = await POST(
      webhookRequest(PUBLISHED, await sign(PUBLISHED, "any-secret")),
    );

    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SANITY_WEBHOOK_SECRET");
    expect(edges.revalidateTag).not.toHaveBeenCalled();
  });
});
