import { afterEach, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());
it("remembers acceptance across callers even when browser storage is blocked", async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  });
  const target = new EventTarget();
  vi.stubGlobal("window", target);
  const accepted = vi.fn();
  target.addEventListener("peploes:newsletter:accepted", accepted);
  const { hasNewsletterSubscription, rememberNewsletterSubscription } =
    await import("@/lib/newsletter-subscription");
  expect(hasNewsletterSubscription()).toBe(false);
  rememberNewsletterSubscription();
  expect(hasNewsletterSubscription()).toBe(true);
  expect(accepted).toHaveBeenCalledOnce();
});
it("recognizes a subscription remembered by a previous visit", async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", { getItem: () => "true" });
  const { hasNewsletterSubscription } = await import(
    "@/lib/newsletter-subscription"
  );
  expect(hasNewsletterSubscription()).toBe(true);
});
