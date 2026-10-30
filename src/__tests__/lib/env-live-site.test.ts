import { afterEach, describe, expect, it, vi } from "vitest";

function loadEnv() {
  vi.resetModules();
  return import("@/lib/env");
}

afterEach(() => vi.unstubAllEnvs());

describe("isLiveSiteClient", () => {
  it("collects only when the deployment is explicitly production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    expect((await loadEnv()).isLiveSiteClient()).toBe(true);
  });

  it.each([
    ["unset", ""],
    ["preview", "preview"],
    ["development", "development"],
  ])(
    "stays off in a production build when the signal is %s",
    async (_label, value) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", value);
      expect((await loadEnv()).isLiveSiteClient()).toBe(false);
    },
  );
});
