import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { expect, test } from "./menu-test";

test("footer content stays visible without scroll reveal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contact");
  await expect(
    page.locator("main [data-scroll-reveal-state]").first(),
  ).toBeAttached();
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator("[data-scroll-reveal-state]")).toHaveCount(0);
  for (const section of await footer
    .locator("[data-footer-section]:visible, [data-footer-meta]:visible")
    .all()) {
    await expect(section).toHaveCSS("opacity", "1");
    await expect(section).toHaveCSS("transform", "none");
  }
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator("[data-scroll-reveal-state]")).toHaveCount(0);
});

test("removed reveal targets stop being observed during menu replacement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const unobserve = IntersectionObserver.prototype.unobserve;
    IntersectionObserver.prototype.unobserve = function (target) {
      if (target.id.startsWith("removed-reveal-"))
        document.documentElement.dataset.lastUnobservedReveal = target.id;
      return unobserve.call(this, target);
    };
  });
  await page.goto("/menus?menu=wine");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  await expect(
    navigation.getByRole("link", { name: "Wine", exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-menu",
    "dinner",
  );
  await expect(page.locator("[data-menu-content]")).toHaveAttribute(
    "data-phase",
    "idle",
  );
  for (let index = 0; index < 3; index++) {
    const id = `removed-reveal-${index}`;
    await page.evaluate((id) => {
      const target = document.createElement("div");
      target.id = id;
      target.dataset.scrollReveal = "";
      target.style.marginTop = "10000px";
      document.querySelector("main")?.append(target);
    }, id);
    await expect(page.locator(`#${id}`)).toHaveAttribute(
      "data-scroll-reveal-state",
      "pending",
    );
    await page.locator(`#${id}`).evaluate((element) => element.remove());
    await expect(page.locator("html")).toHaveAttribute(
      "data-last-unobserved-reveal",
      id,
    );
  }
});

for (const path of [
  "/our-story",
  "/journal",
  "/journal/growers-we-work-with",
  "/menus?menu=lunch",
  "/menus?menu=dinner",
  "/menus?menu=pre-theatre",
  "/menus?menu=seasonal",
  "/menus?menu=group-set-menu",
  "/menus?menu=cocktails",
  "/menus?menu=wine",
  "/private-dining",
  "/private-dining/groups-celebrations",
  "/private-dining/corporate-events",
  "/private-dining/weddings",
  "/seasonal",
  "/seasonal/rugby-at-peploes",
  "/seasonal/italian-wine-dinner",
  "/seasonal/christmas-at-peploes",
  "/seasonal/sunday-at-peploes",
  "/seasonal/lobster-season",
  "/seasonal/new-years-eve",
  "/book-a-table",
  "/contact",
  "/privacy-cookies",
  "/accessibility-policy",
  "/terms-conditions",
  "/booking-cancellation-terms",
]) {
  test(`${path} reveals content smoothly on scroll`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(
      page.locator("main [data-scroll-reveal-state]").first(),
    ).toBeAttached();
    const uncovered = await page.locator("main section").evaluateAll(
      (sections, mapLabel) =>
        sections
          .filter((section) => section.getAttribute("aria-label") !== mapLabel)
          .filter((section) => section.textContent?.trim())
          .filter(
            (section) =>
              !section.closest("[data-scroll-reveal]") &&
              !section.querySelector("[data-scroll-reveal]"),
          )
          .map(
            (section) => section.getAttribute("aria-labelledby") ?? section.id,
          ),
      VISIT_CONTACT_CONTENT.location.map.label,
    );
    expect(uncovered).toEqual([]);

    const groups = page.locator("main [data-scroll-reveal-state]:visible");
    const pendingIndex = await groups.evaluateAll((elements) =>
      elements.findIndex(
        (element) =>
          element.getAttribute("data-scroll-reveal-state") === "pending",
      ),
    );
    if (pendingIndex < 0) {
      for (const group of await groups.all())
        await expect(group).toBeInViewport();
    } else {
      const content = groups.nth(pendingIndex);
      await expect(content).toHaveCSS("opacity", "0");
      const height = (await content.boundingBox())?.height;
      const [duration] = await Promise.all([
        content.evaluate(
          (element) =>
            new Promise<number>((resolve) => {
              element.addEventListener("transitionend", (event) => {
                if (
                  event instanceof TransitionEvent &&
                  event.target === element &&
                  event.propertyName === "transform"
                )
                  resolve(event.elapsedTime);
              });
            }),
        ),
        content.evaluate((element) =>
          window.scrollTo({
            top:
              scrollY +
              element.getBoundingClientRect().top -
              innerHeight * 0.55,
            behavior: "instant",
          }),
        ),
      ]);
      expect(duration).toBeCloseTo(0.35);
      await expect(content).toHaveCSS("opacity", "1");
      await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
      expect((await content.boundingBox())?.height).toBe(height);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("[data-scroll-reveal-state]")).toHaveCount(0);
    for (const group of await page
      .locator("main [data-scroll-reveal]:visible")
      .all())
      await expect(group).toHaveCSS("opacity", "1");
  });
}

test("hidden streamed Journal content waits for layout before revealing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/journal");
  await expect(
    page.locator("main [data-scroll-reveal-state]").first(),
  ).toBeAttached();
  await page.evaluate(async () => {
    const buffer = document.createElement("div");
    buffer.id = "journal-stream-buffer";
    buffer.hidden = true;
    const content = document.createElement("p");
    content.id = "journal-streamed-copy";
    content.dataset.scrollReveal = "";
    content.textContent = "Late arriving Journal content";
    content.style.marginTop = "100vh";
    buffer.append(content);
    document.body.append(buffer);
    // Let mutation observers process the hidden streaming buffer before inspection.
    await new Promise(requestAnimationFrame);
  });
  const streamed = page.locator("#journal-streamed-copy");
  await expect(streamed).not.toHaveAttribute("data-scroll-reveal-state", /.+/);
  await streamed.evaluate((element) => {
    document.querySelector("main")?.append(element);
    document.querySelector("#journal-stream-buffer")?.remove();
  });
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "pending");
  await expect(streamed).toHaveCSS("opacity", "0");
  await expect(streamed).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 24)");
  await streamed.scrollIntoViewIfNeeded();
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "visible");
  await expect(streamed).toHaveCSS("transition-duration", "0.35s, 0.35s");
  await expect(streamed).toHaveCSS("opacity", "1");
  await expect(streamed).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("hidden streamed content waits for layout before reveal registration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/menus?menu=dinner");
  await expect(
    page.locator("main [data-scroll-reveal-state]").first(),
  ).toBeAttached();
  await page.evaluate(() => {
    const boundary = document.createElement("div");
    boundary.hidden = true;
    boundary.id = "stream-boundary";
    const content = document.createElement("div");
    content.id = "streamed-hidden-copy";
    content.dataset.scrollReveal = "";
    content.textContent = "Streamed content";
    content.style.marginTop = "10000px";
    boundary.append(content);
    document.body.append(boundary);
    return new Promise(requestAnimationFrame);
  });
  const streamed = page.locator("#streamed-hidden-copy");
  await expect(streamed).not.toHaveAttribute("data-scroll-reveal-state", /.+/);
  await page.evaluate(() => {
    const content = document.getElementById("streamed-hidden-copy");
    if (content) document.querySelector("main")?.append(content);
    document.getElementById("stream-boundary")?.remove();
  });
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "pending");
  await expect(streamed).toHaveCSS("opacity", "0");
  await streamed.scrollIntoViewIfNeeded();
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "visible");
  await expect(streamed).toHaveCSS("opacity", "1");
});
test("client navigation and streamed content retain reveal behavior", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/menus?menu=lunch");
  const navigation = page.getByRole("navigation", { name: "Restaurant menus" });
  await expect
    .poll(async () =>
      navigation
        .locator("[data-menu-indicator]")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(0);
  await navigation.getByRole("link", { name: "Dinner", exact: true }).click();
  await expect(page).toHaveURL("/menus?menu=dinner");
  const content = page.locator("[data-menu-content]");
  await expect(content).toHaveAttribute("data-menu", "dinner");
  await expect(content).toHaveAttribute("data-phase", "idle");
  await expect(
    content.locator('[data-scroll-reveal-state="pending"]').first(),
  ).toBeAttached();
  await page.evaluate(() => {
    const content = document.createElement("div");
    content.id = "streamed-copy";
    content.dataset.scrollReveal = "";
    content.textContent = "Late arriving content";
    content.style.height = `${innerHeight * 10}px`;
    document.querySelector("main")?.append(content);
  });
  const streamed = page.locator("#streamed-copy");
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "pending");
  await streamed.evaluate((element) =>
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - innerHeight * 0.7,
      behavior: "instant",
    }),
  );
  await expect(streamed).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(streamed).toHaveAttribute("data-scroll-reveal-state", "visible");
});
