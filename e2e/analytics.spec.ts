import {
  acceptAll,
  expect,
  expectPageViews,
  openPreferences,
  providerStorage,
  rejectAll,
  settle,
  suppressNavigationOfLinks,
  test,
} from "./analytics-harness";
import { chooseDate, laterFreeDate } from "./booking-page";

test.setTimeout(90_000);

const SDK_OPT_OUT_FLAG = /^__ph_opt_in_out_/;

async function ownedStorage(page: Parameters<typeof providerStorage>[0]) {
  return (await providerStorage(page)).filter(
    (key) => !SDK_OPT_OUT_FLAG.test(key),
  );
}

function path(url: unknown): string {
  return new URL(String(url)).pathname;
}

test.describe("before and after placeholder choices", () => {
  test("collects pageviews before any placeholder choice", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await expectPageViews(page, analytics, 1);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 2);
    expect((await ownedStorage(page)).length).toBeGreaterThan(0);
  });

  test("rejection does not stop pageviews across navigation and reload", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await rejectAll(page);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 2);
    await page.reload();
    await expectPageViews(page, analytics, 3);
  });

  test("blocked preference and attribution storage leaves collection and navigation usable", async ({
    page,
    analytics,
  }) => {
    await page.addInitScript(() => {
      for (const name of ["localStorage", "sessionStorage"])
        Object.defineProperty(window, name, {
          get() {
            throw new Error("blocked");
          },
        });
    });
    await page.goto("/");
    await expectPageViews(page, analytics, 1);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 2);
  });
});

test.describe("grant and navigation", () => {
  test("saving placeholder preferences keeps one initial pageview per provider with safe fields", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await expectPageViews(page, analytics, 1);
    await acceptAll(page);
    await settle(page);
    expect(analytics.gaPageViews()).toHaveLength(1);
    expect(analytics.posthogPageViews()).toHaveLength(1);

    const origin = new URL(page.url()).origin;
    expect(analytics.gaPageViews()[0]?.location).toBe(`${origin}/`);
    const [view] = analytics.posthogPageViews();
    expect(view?.properties.$current_url).toBe(`${origin}/`);
    expect(
      analytics.traffic.filter((t) => t.provider === "gtag-js"),
    ).toHaveLength(1);

    // The SDK adds nothing of its own: no flags, config, surveys or extra events.
    expect(
      analytics.traffic.filter((t) => t.provider === "posthog-asset"),
    ).toEqual([]);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("pagehide"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await settle(page);
    expect(new Set(analytics.posthogEvents.map((e) => e.event))).toEqual(
      new Set(["$pageview"]),
    );
  });

  test("client navigation and history moves count once each, revisits included", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);

    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 2);
    await page.locator('a[href="/"]:visible').first().click();
    await expect(page).toHaveURL("/");
    await expectPageViews(page, analytics, 3);
    await page.goBack();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 4);
    await page.goForward();
    await expect(page).toHaveURL("/");
    await expectPageViews(page, analytics, 5);

    const expected = ["/", "/our-story", "/", "/our-story", "/"];
    expect(analytics.gaPageViews().map((h) => path(h.location))).toEqual(
      expected,
    );
    expect(
      analytics.posthogPageViews().map((e) => path(e.properties.$current_url)),
    ).toEqual(expected);
    const referrers = analytics
      .gaPageViews()
      .map((h) => h.params.page_referrer);
    expect(referrers[1]).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  test("reload keeps the choice and counts the new page load once", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);
    await page.reload();
    await expectPageViews(page, analytics, 2);
    const dialog = await openPreferences(page);
    await expect(
      dialog.getByRole("switch", { name: "Analytics", exact: true }),
    ).toBeChecked();
  });

  test("keyboard operation grants analytics and restores focus", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", {
      name: "Cookie Settings",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Cookie Preferences",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const analyticsSwitch = dialog.getByRole("switch", {
      name: "Analytics",
      exact: true,
    });
    await analyticsSwitch.focus();
    await page.keyboard.press("Space");
    await expect(analyticsSwitch).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expectPageViews(page, analytics, 1);
  });
});

test.describe("placeholder preference changes", () => {
  test("rejection keeps optional interactions, attribution and pageviews active", async ({
    page,
    analytics,
  }) => {
    await page.goto("/?utm_source=newsletter");
    await expectPageViews(page, analytics, 1);
    await rejectAll(page);
    await suppressNavigationOfLinks(page);
    await page.locator('footer a[href^="tel:"]:visible').first().click();
    await expect
      .poll(() => analytics.posthogNamed("contact_click").length)
      .toBe(1);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 2);
    expect(analytics.posthogPageViews()[1]?.properties.utm_source).toBe(
      "newsletter",
    );
  });

  test("changing preferences during GA4 loading does not suppress or duplicate the initial events", async ({
    page,
    analytics,
  }) => {
    analytics.hold();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await rejectAll(page);
    analytics.release();
    await expectPageViews(page, analytics, 1);
    expect(analytics.posthogPageViews()).toHaveLength(1);
  });

  test("a late GA4 load after rejection sends the current page once", async ({
    page,
    analytics,
  }) => {
    analytics.hold();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await rejectAll(page);
    analytics.release();
    await expectPageViews(page, analytics, 1);
    await acceptAll(page);
    await settle(page);
    expect(analytics.gaPageViews()).toHaveLength(1);
    expect(analytics.posthogPageViews()).toHaveLength(1);
  });

  test("repeated preference changes do not reload providers or replay events", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await expectPageViews(page, analytics, 1);
    await rejectAll(page);
    await acceptAll(page);
    await rejectAll(page);
    await acceptAll(page);
    await settle(page);
    expect(analytics.gaPageViews()).toHaveLength(1);
    expect(analytics.posthogPageViews()).toHaveLength(1);
  });

  test("a second tab's rejection does not stop the first tab", async ({
    page,
    context,
    analytics,
  }) => {
    await page.goto("/");
    await expectPageViews(page, analytics, 1);
    const other = await context.newPage();
    await other.goto("/contact");
    await expectPageViews(page, analytics, 2);
    await rejectAll(other);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expectPageViews(page, analytics, 3);
    await other.close();
  });
});

test.describe("failing providers", () => {
  test("blocked gtag.js and PostHog leave the site working and silent", async ({
    page,
    analytics,
  }) => {
    analytics.block("gtag-js", "posthog");
    await page.goto("/");
    await acceptAll(page);
    await page.locator('a[href="/our-story"]:visible').first().click();
    await expect(page).toHaveURL("/our-story");
    await expect(page.getByRole("main")).toBeVisible();
    await settle(page);
    // The SDK still attempts its (aborted) sends; none can be delivered.
    expect(analytics.ga).toEqual([]);
    expect(
      analytics.traffic.filter((t) => t.provider === "gtag-js"),
    ).toHaveLength(1);
  });
});

test.describe("payload privacy", () => {
  test("query strings, hashes and personal values never reach a provider", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);
    await page.goto(
      "/our-story?utm_source=jane@example.com&email=x&token=abc123#private-hash",
    );
    await expectPageViews(page, analytics, 2);

    const payload = JSON.stringify([analytics.ga, analytics.posthogEvents]);
    for (const secret of [
      "jane",
      "example.com",
      "email=x",
      "abc123",
      "private-hash",
      "?",
      "#",
    ]) {
      expect(payload, `payload contains ${secret}`).not.toContain(secret);
    }
    expect(analytics.ga.every((hit) => !("utm_source" in hit.params))).toBe(
      true,
    );
  });

  test("safe campaign values are kept and click identifiers are not", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);
    await page.goto(
      "/?utm_source=newsletter&utm_medium=email&gclid=abc999&fbclid=zzz888",
    );
    await expectPageViews(page, analytics, 2);

    const last = analytics.gaPageViews().at(-1);
    expect(last?.params.utm_source).toBe("newsletter");
    expect(last?.params.utm_medium).toBe("email");
    const payload = JSON.stringify([analytics.ga, analytics.posthogEvents]);
    for (const secret of ["abc999", "zzz888", "gclid", "fbclid"]) {
      expect(payload).not.toContain(secret);
    }
  });
});

test.describe("interaction events", () => {
  test("booking, contact, directions and menu events carry only closed identifiers", async ({
    page,
    analytics,
  }) => {
    await page.goto("/");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);

    await page
      .locator(
        'nav[aria-label="Main navigation"] a[href="/book-a-table"]:visible',
      )
      .first()
      .click();
    await expect(page).toHaveURL("/book-a-table");
    await suppressNavigationOfLinks(page);
    await page.locator('footer a[href^="tel:"]:visible').first().click();
    await page.locator('footer a[href^="mailto:"]:visible').first().click();
    await expect
      .poll(() => analytics.posthogNamed("contact_click").length)
      .toBe(2);
    await page.goto("/contact");
    await expect
      .poll(() =>
        analytics
          .posthogPageViews()
          .some((e) => e.properties.$pathname === "/contact"),
      )
      .toBe(true);
    await page.context().route("https://www.google.com/maps/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>maps</title>",
      }),
    );
    const directions = page.waitForEvent("popup");
    await page
      .getByRole("link", { name: "Get Directions", exact: true })
      .click();
    await (await directions).close();
    await expect
      .poll(() => analytics.posthogNamed("directions_click").length, {
        timeout: 2500,
      })
      .toBe(1);
    await page.goto("/menus/lunch");

    await expect.poll(() => analytics.gaNamed("menu_view").length).toBe(1);
    await settle(page);

    const expectEvent = (name: string, params: Record<string, string>) => {
      const ga = analytics.gaNamed(name);
      expect(ga, `GA ${name}`).toHaveLength(1);
      const { page_location: location, ...rest } = ga[0]?.params ?? {};
      expect(rest).toEqual(params);
      expect(location).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[^?#]*$/);
      const posthog = analytics.posthogNamed(name);
      expect(posthog, `PostHog ${name}`).toHaveLength(1);
      for (const [key, value] of Object.entries(params)) {
        expect(posthog[0]?.properties[key]).toBe(value);
      }
    };
    expectEvent("booking_click", { placement: "navbar" });
    expect(analytics.gaNamed("contact_click")).toHaveLength(2);
    expect(
      analytics
        .gaNamed("contact_click")
        .map((h) => h.params.destination)
        .sort(),
    ).toEqual(["email", "phone"]);
    expect(
      analytics
        .posthogNamed("contact_click")
        .map((e) => `${e.properties.placement}:${e.properties.destination}`)
        .sort(),
    ).toEqual(["footer:email", "footer:phone"]);
    expectEvent("directions_click", { placement: "visit_contact" });
    expectEvent("menu_view", { menu: "lunch" });

    const names = new Set(analytics.ga.map((h) => h.event));
    expect([...names].sort()).toEqual([
      "booking_click",
      "contact_click",
      "directions_click",
      "menu_view",
      "page_view",
    ]);
    const everything = JSON.stringify([analytics.ga, analytics.posthogEvents]);
    for (const forbidden of [
      "tel:",
      "mailto:",
      "@",
      "find-us",
      "google.com/maps",
    ]) {
      expect(everything).not.toContain(forbidden);
    }
  });

  test("the booking journey reports provider-confirmed funnel stages without guest details", async ({
    page,
    analytics,
  }) => {
    await page.goto("/book-a-table");
    await acceptAll(page);
    await expectPageViews(page, analytics, 1);

    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    await chooseDate(reservations, laterFreeDate());
    await reservations
      .getByRole("button", { name: "Find a Table", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "7:00 pm", exact: true })
      .click();
    await reservations
      .getByLabel("I understand the table is required back by 9:00 pm")
      .check();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await reservations
      .getByLabel("First name", { exact: false })
      .fill("Preview");
    await reservations.getByLabel("Surname", { exact: false }).fill("Guest");
    await reservations
      .getByLabel("Email address", { exact: false })
      .fill("preview@example.com");
    await reservations
      .getByLabel("Mobile number", { exact: false })
      .fill("087 123 4567");
    await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
    await reservations
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", { name: "Your table is booked." }),
    ).toBeVisible();
    await settle(page);

    const expected = [
      "page_view",
      "booking_search",
      "booking_availability",
      "booking_hold",
      "booking_details",
      "booking_details",
      "booking_confirmed",
    ];
    expect(analytics.ga.map((h) => h.event)).toEqual(expected);
    expect(analytics.posthogEvents.map((e) => e.event)).toEqual([
      "$pageview",
      ...expected.slice(1),
    ]);
    const stages = analytics.ga.filter((hit) =>
      hit.event.startsWith("booking_"),
    );
    expect(new Set(stages.map((hit) => hit.params.attempt_id)).size).toBe(1);
    const everything = JSON.stringify([analytics.ga, analytics.posthogEvents]);
    for (const personal of [
      "preview@example.com",
      "Preview",
      "Guest",
      "087 123 4567",
      "purchase",
      "booking_complete",
    ]) {
      expect(everything).not.toContain(personal);
    }
  });
});

test("the CSP permits the intercepted provider origins and keeps Stripe on booking", async ({
  page,
}) => {
  const home = await page.goto("/");
  const homeCsp = home?.headers()["content-security-policy"] ?? "";
  expect(homeCsp).toContain("https://www.googletagmanager.com");
  expect(homeCsp).toContain("https://*.posthog.com");
  const booking = await page.goto("/book-a-table");
  const bookingCsp = booking?.headers()["content-security-policy"] ?? "";
  expect(bookingCsp).toContain("https://*.posthog.com");
  expect(bookingCsp).toContain("stripe.com");
});
