import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("existing email environment settings", () => {
  async function loadEmailEnvironment(settings: Record<string, string>) {
    vi.resetModules();
    for (const key of Object.keys(process.env)) {
      if (/^(EMAIL_|SMTP_|RESEND_|PREFER_SMTP$|ADMIN_EMAIL$)/.test(key)) {
        vi.stubEnv(key, undefined);
      }
    }
    for (const [key, value] of Object.entries(settings)) {
      vi.stubEnv(key, value);
    }
    return (await import("@/lib/env")).env;
  }

  it("loads the existing SMTP credentials and restaurant identity", async () => {
    const env = await loadEmailEnvironment({
      PREFER_SMTP: "true",
      SMTP_HOST: "smtp.example.test",
      SMTP_PORT: "587",
      SMTP_USER: "sender@example.test",
      SMTP_PASS: "synthetic-password",
      SMTP_FROM_EMAIL: "sender@example.test",
      RESEND_FROM_NAME: "Restaurant Test",
      ADMIN_EMAIL: "restaurant@example.test",
    });

    expect(env.EMAIL_SMTP_HOST).toBe("smtp.example.test");
    expect(env.EMAIL_SMTP_PORT).toBe(587);
    expect(env.EMAIL_SMTP_USERNAME).toBe("sender@example.test");
    expect(env.EMAIL_SMTP_PASSWORD).toBe("synthetic-password");
    expect(env.EMAIL_SMTP_AUTH_METHOD).toBe("app-password");
    expect(env.EMAIL_FROM_ADDRESS).toBe("sender@example.test");
    expect(env.EMAIL_FROM_NAME).toBe("Restaurant Test");
    expect(env.EMAIL_RESTAURANT_TO).toBe("restaurant@example.test");
    expect(env.EMAIL_REPLY_TO).toBe("restaurant@example.test");
  });

  it("uses the selected provider's sender without replacing explicit email settings", async () => {
    const env = await loadEmailEnvironment({
      PREFER_SMTP: "false",
      RESEND_API_KEY: "synthetic-resend-key",
      SMTP_FROM_EMAIL: "smtp@example.test",
      RESEND_FROM_EMAIL: "resend@example.test",
      ADMIN_EMAIL: "admin@example.test",
      EMAIL_REPLY_TO: "reply@example.test",
      EMAIL_RESTAURANT_TO: "enquiries@example.test",
    });

    expect(env.EMAIL_RESEND_API_KEY).toBe("synthetic-resend-key");
    expect(env.EMAIL_FROM_ADDRESS).toBe("resend@example.test");
    expect(env.EMAIL_REPLY_TO).toBe("reply@example.test");
    expect(env.EMAIL_RESTAURANT_TO).toBe("enquiries@example.test");
  });

  it("preserves explicitly configured SMTP and sender credentials over existing names", async () => {
    const env = await loadEmailEnvironment({
      EMAIL_SMTP_HOST: "current.example.test",
      EMAIL_SMTP_PORT: "465",
      EMAIL_SMTP_USERNAME: "current@example.test",
      EMAIL_SMTP_PASSWORD: "current-password",
      EMAIL_SMTP_AUTH_METHOD: "oauth2",
      EMAIL_FROM_ADDRESS: "current@example.test",
      EMAIL_FROM_NAME: "Current Restaurant",
      EMAIL_RESEND_API_KEY: "current-key",
      SMTP_HOST: "old.example.test",
      SMTP_PORT: "587",
      SMTP_USER: "old@example.test",
      SMTP_PASS: "old-password",
      SMTP_FROM_EMAIL: "old@example.test",
      RESEND_FROM_NAME: "Old Restaurant",
      RESEND_API_KEY: "old-key",
    });

    expect(env.EMAIL_SMTP_HOST).toBe("current.example.test");
    expect(env.EMAIL_SMTP_PORT).toBe(465);
    expect(env.EMAIL_SMTP_USERNAME).toBe("current@example.test");
    expect(env.EMAIL_SMTP_PASSWORD).toBe("current-password");
    expect(env.EMAIL_SMTP_AUTH_METHOD).toBe("oauth2");
    expect(env.EMAIL_FROM_ADDRESS).toBe("current@example.test");
    expect(env.EMAIL_FROM_NAME).toBe("Current Restaurant");
    expect(env.EMAIL_RESEND_API_KEY).toBe("current-key");
  });
});
