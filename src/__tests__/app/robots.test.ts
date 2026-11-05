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

describe("robots route", () => {
  it.each([
    ["production", "production"],
    ["production", "preview"],
    ["development", ""],
    ["production", ""],
  ])(
    "uses the shared crawler policy with Node %s and Vercel %s",
    async (nodeEnv, vercelEnv) => {
      const result = await robotsFor({ nodeEnv, vercelEnv });
      expect(result.sitemap).toBe("http://localhost:3000/sitemap.xml");
      expect(result.rules).toContainEqual({ userAgent: "*", allow: "/" });
    },
  );
});
