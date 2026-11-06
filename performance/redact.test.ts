import { describe, expect, it } from "vitest";
import { redact } from "./redact";

describe("audit evidence privacy", () => {
  it("redacts URL credentials while preserving menu identity", () => {
    expect(
      redact("https://tiles.test/image?access_token=public-key&menu=wine", {}),
    ).toBe("https://tiles.test/image?access_token=[REDACTED]&menu=wine");
  });
  it("redacts configured secrets and their URL-encoded form", () => {
    const env: Record<string, string> = {};
    env.BOOKING_HOLD_SECRET = "secret+value";
    expect(redact("secret+value secret%2Bvalue", env)).toBe(
      "[REDACTED] [REDACTED]",
    );
  });
  it("preserves numeric results and nonsecret requested URLs", () => {
    const report =
      '{"requestedUrl":"https://site.test/menus?menu=dinner","score":0.899999}';
    expect(redact(report, {})).toBe(report);
  });
});
