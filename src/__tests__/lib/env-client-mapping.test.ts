import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("client environment mapping", () => {
  const source = readFileSync("src/lib/env.ts", "utf8");
  const clientBlock = source.slice(
    source.indexOf("client: {"),
    source.indexOf("runtimeEnv"),
  );
  const names = [...clientBlock.matchAll(/^\s+(NEXT_PUBLIC_\w+):/gm)].map(
    (match) => match[1],
  );

  it("finds the public variables", () => {
    expect(names).toContain("NEXT_PUBLIC_POSTHOG_KEY");
    expect(names).toContain("NEXT_PUBLIC_GA_MEASUREMENT_ID");
  });

  // Next only inlines literal process.env.NEXT_PUBLIC_* reads into the browser.
  it.each(names)("reads %s as a literal for the browser bundle", (name) => {
    expect(source).toMatch(
      new RegExp(`${name}:\\s*process\\.env\\.${name}\\b`, "u"),
    );
  });
});
