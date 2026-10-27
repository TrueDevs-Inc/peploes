import { afterEach, describe, expect, it, vi } from "vitest";

async function builtSignal(): Promise<string | undefined> {
  vi.resetModules();
  const config = (await import("../../../next.config")).default;
  return (config as { env?: Record<string, string> }).env
    ?.NEXT_PUBLIC_VERCEL_ENV;
}

afterEach(() => vi.unstubAllEnvs());

describe("browser live-site signal at build time", () => {
  it("derives from Vercel's own VERCEL_ENV", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await builtSignal()).toBe("production");
  });

  it("lets a QA build override it explicitly", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await builtSignal()).toBe("production");
  });

  it("stays empty, so collection stays off, when neither is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(await builtSignal()).toBe("");
  });
});
