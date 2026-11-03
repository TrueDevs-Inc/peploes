import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { NewsletterSignup } from "@/components/app/molecules/newsletter-signup";

vi.mock("@/components/app/molecules/newsletter-signup.module.css", () => ({
  default: {},
}));
vi.mock("@/components/ui/button.module.css", () => ({ default: {} }));
vi.mock("@/actions/newsletter", () => ({ submitNewsletter: vi.fn() }));
it("gives coexisting newsletter forms distinct associated labels and status IDs", () => {
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(NewsletterSignup),
      createElement(NewsletterSignup),
    ),
  );
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
  expect(ids).toHaveLength(6);
  expect(new Set(ids).size).toBe(ids.length);
  for (const match of html.matchAll(/ for="([^"]+)"/g))
    expect(ids).toContain(match[1]);
});
