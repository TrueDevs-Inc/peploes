import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const runtimeCheck = `
  import * as Sentry from "@sentry/nextjs";
  await import(process.env.SENTRY_TEST_CONFIG);
  const options = Sentry.getClient().getOptions();
  let deliveries = 0;
  const client = new Sentry.NodeClient({
    ...options,
    integrations: [],
    transport: () => ({
      send(envelope) {
        if (envelope[1].some(([header, payload]) =>
          header.type === "event" &&
          JSON.stringify(payload).includes("Synthetic deployment gate check")
        )) deliveries++;
        return Promise.resolve({ statusCode: 200 });
      },
      flush: () => Promise.resolve(true),
    }),
  });
  client.captureException(new Error("Synthetic deployment gate check"));
  await client.flush(2000);
  console.log(JSON.stringify({ deliveries, environment: options.environment, release: options.release }));
  await client.close(2000);
  await Sentry.close(2000);
`;

describe("Sentry deployment policy", function sentryDeploymentTests() {
  for (const runtime of ["server", "edge"]) {
    it.each([
      {
        deployment: "production",
        dsn: "https://public@o0.ingest.sentry.io/1",
        deliveries: 1,
      },
      {
        deployment: "preview",
        dsn: "https://public@o0.ingest.sentry.io/1",
        deliveries: 1,
      },
      {
        deployment: "",
        dsn: "https://public@o0.ingest.sentry.io/1",
        deliveries: 1,
      },
      { deployment: "production", dsn: "", deliveries: 0 },
      {
        deployment: "production",
        dsn: "https://public@o0.ingest.sentry.io/1",
        nodeEnv: "development",
        deliveries: 0,
      },
      {
        deployment: "production",
        dsn: "https://public@o0.ingest.sentry.io/1",
        nodeEnv: "test",
        deliveries: 0,
      },
      {
        deployment: "preview",
        dsn: "https://public@o0.ingest.sentry.io/1",
        environment: "staging",
        deliveries: 1,
      },
    ] satisfies {
      deployment: string;
      dsn: string;
      deliveries: number;
      nodeEnv?: "production" | "development" | "test";
      environment?: string;
    }[])(
      `${runtime}: sends $deliveries events for deployment=$deployment`,
      function checksDelivery({
        deployment,
        dsn,
        deliveries,
        environment = "",
        nodeEnv = "production" as const,
      }) {
        const result = spawnSync("bun", ["--eval", runtimeCheck], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: nodeEnv,
            VERCEL_ENV: deployment,
            SENTRY_DSN: dsn,
            SENTRY_ENVIRONMENT: environment,
            SENTRY_RELEASE: "staging-release-test",
            NEXT_PUBLIC_SENTRY_DSN: "",
            SENTRY_TEST_CONFIG: `./sentry.${runtime}.config.ts`,
          },
          encoding: "utf8",
          timeout: 10000,
        });

        expect(result.error).toBeUndefined();
        expect(result.status, result.stderr).toBe(0);
        expect(JSON.parse(result.stdout.trim())).toEqual({
          deliveries,
          environment: environment || deployment || "development",
          release: "staging-release-test",
        });
      },
    );
  }

  it.each(["production", "preview", ""])(
    "derives the browser environment from deployment=%s",
    function checksBrowserBuildEnvironment(deployment) {
      const result = spawnSync(
        "bun",
        [
          "--eval",
          `
      const { default: config } = await import("./next.config.ts");
      console.log(config.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT);
    `,
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: "production",
            VERCEL_ENV: deployment,
            SENTRY_AUTH_TOKEN: "",
            SENTRY_ENVIRONMENT: "",
            NEXT_PUBLIC_SENTRY_ENVIRONMENT: "production",
          },
          encoding: "utf8",
          timeout: 10000,
        },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trim()).toBe(deployment || "development");
    },
  );
});
