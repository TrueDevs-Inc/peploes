import { afterEach, describe, expect, it, vi } from "vitest";

async function robotsFor(environment: { nodeEnv: string; vercelEnv?: string }) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", environment.nodeEnv);
  vi.stubEnv("VERCEL_ENV", environment.vercelEnv ?? "");
  const { default: robots } = await import("@/app/robots");
  return robots();
}

afterEach(function resetEnv() {
  vi.unstubAllEnvs();
});

describe("robots route", function robotsRouteTests() {
  it("allows search crawlers on the Vercel production deployment", async function productionTest() {
    const result = await robotsFor({
      nodeEnv: "production",
      vercelEnv: "production",
    });

    expect(result.sitemap).toBe("http://localhost:3000/sitemap.xml");
    expect(result.rules).toContainEqual({ userAgent: "*", allow: "/" });
  });

  it("lets crawlers fetch Vercel previews so their noindex signals are seen", async function previewTest() {
    const result = await robotsFor({
      nodeEnv: "production",
      vercelEnv: "preview",
    });

    expect(result).toEqual({ rules: { userAgent: "*", allow: "/" } });
  });

  it("lets crawlers fetch local development, which is also noindex", async function localTest() {
    const result = await robotsFor({ nodeEnv: "development" });

    expect(result).toEqual({ rules: { userAgent: "*", allow: "/" } });
  });

  it("treats a production build outside Vercel as live", async function selfHostedTest() {
    const result = await robotsFor({ nodeEnv: "production" });

    expect(result.rules).toContainEqual({ userAgent: "*", allow: "/" });
  });
});
