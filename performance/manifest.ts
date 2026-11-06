import { z } from "zod";

export class PerformanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PerformanceError";
  }
}

export const phaseSchema = z.enum([
  "baseline",
  "candidate",
  "deployment",
  "diagnostic",
]);
export type TPhase = z.infer<typeof phaseSchema>;

export const STATIC_PATHS = [
  "/",
  "/menus",
  "/book-a-table",
  "/our-story",
  "/visit-contact",
  "/journal",
  "/seasonal",
  "/menus?menu=lunch",
  "/menus?menu=dinner",
  "/menus?menu=pre-theatre",
  "/menus?menu=wine",
  "/menus?menu=cocktails",
  "/menus?menu=group-set-menu",
  "/menus?menu=seasonal",
  "/private-dining",
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
  "/privacy-cookies",
  "/accessibility-policy",
  "/terms-conditions",
  "/booking-cancellation-terms",
] as const;

const contentSchema = z.object({
  id: z.string().min(1),
  revision: z.string().min(1),
  updatedAt: z.iso.datetime(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  imageHash: z.string().regex(/^[a-f0-9]{64}$/),
  noIndex: z.boolean(),
  bodyImages: z.number().int().nonnegative(),
});

export const routeSchema = z
  .object({
    path: z.string().startsWith("/"),
    heading: z.string().min(1),
    requiredText: z.array(z.string().min(1)).min(1),
    hero: z.boolean(),
    menu: z.string().optional(),
    map: z.enum(["static", "interactive"]).optional(),
    content: contentSchema.optional(),
  })
  .refine((route) => route.path !== "/visit-contact" || Boolean(route.map), {
    message: "Visit requires an explicit normal map configuration.",
  });
export type TRoute = z.infer<typeof routeSchema>;

export const manifestSchema = z.object({
  version: z.literal(1),
  status: z.literal("ready"),
  cms: z.object({
    projectId: z.string().regex(/^[a-z0-9]+$/),
    dataset: z.string().regex(/^[a-z0-9_-]+$/),
    apiVersion: z.iso.date(),
  }),
  routes: z.array(routeSchema).length(24),
});
export type TManifest = z.infer<typeof manifestSchema>;

export function assertRepresentativeContent(
  manifest: TManifest,
  phase: TPhase,
): void {
  if (
    phase !== "diagnostic" &&
    manifest.routes.some((route) => route.content?.noIndex)
  ) {
    throw new PerformanceError(
      "Representative scoring requires indexable published Journal and Seasonal details. Published noindex development pages are allowed only with --phase diagnostic and cannot establish acceptance.",
    );
  }
}

export function parseManifest(input: unknown): TManifest {
  const blocked = z
    .object({ status: z.literal("blocked"), reason: z.string() })
    .safeParse(input);
  if (blocked.success)
    throw new PerformanceError(
      `Representative scoring blocked: ${blocked.data.reason}`,
    );
  const manifest = manifestSchema.parse(input);
  const paths = new Set(manifest.routes.map((route) => route.path));
  if (paths.size !== 24 || STATIC_PATHS.some((path) => !paths.has(path))) {
    throw new PerformanceError(
      "Manifest must include all 22 static paths and two unique published details.",
    );
  }
  for (const family of ["journal", "seasonal"]) {
    const details = manifest.routes.filter((route) =>
      new RegExp(`^/${family}/[a-z0-9-]+$`).test(route.path),
    );
    if (details.length !== 1 || !details[0].content || !details[0].hero) {
      throw new PerformanceError(
        `Missing eligible published ${family} detail identity and hero.`,
      );
    }
  }
  for (const route of manifest.routes) {
    const expectedMenu = new URL(
      route.path,
      "https://manifest.invalid",
    ).searchParams.get("menu");
    if (
      (expectedMenu && route.menu !== expectedMenu) ||
      (route.path === "/menus" && route.menu !== "lunch")
    ) {
      throw new PerformanceError(`Wrong menu expectation: ${route.path}`);
    }
  }
  return manifest;
}

export function parseOrigin(value: string): string {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(local && url.protocol === "http:"))
  ) {
    throw new PerformanceError(
      "Origin must be HTTPS, or loopback HTTP, without credentials, path, query or fragment.",
    );
  }
  return url.origin;
}
