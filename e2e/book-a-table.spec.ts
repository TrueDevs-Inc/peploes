import { expect, test } from "./menu-test";

test("navbar booking navigation works and closes the mobile drawer", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  const bookingLink = navigation.getByRole("link", {
    name: isMobile ? "Book" : "Book a Table",
    exact: true,
  });

  await bookingLink.click();

  await expect(page).toHaveURL("/book-a-table");
  await expect(
    page.getByRole("heading", { name: "A table at Peploe’s.", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Table reservations" }),
  ).toBeVisible();

  if (isMobile) {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(menu).toBeVisible();

    await menu.getByRole("link", { name: "Book", exact: true }).click();

    await expect(page).toHaveURL("/book-a-table");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});
test("booking preview moves through time, details and confirmation without submitting a reservation", async ({
  page,
  isMobile,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await expect(reservations.getByText(/Design preview/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(
    reservations.getByRole("heading", { name: "Available times", exact: true }),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
  await reservations
    .getByLabel("I understand the table is required back by 9:00pm")
    .check();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();

  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();
  await expect(
    reservations
      .getByText("Please enter your name.", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    reservations.getByRole("heading", {
      name: "Your table is booked.",
      exact: true,
    }),
  ).toHaveCount(0);

  if (isMobile) {
    await reservations
      .getByLabel("Full name", { exact: false })
      .fill("Preview Guest");
  } else {
    await reservations
      .getByLabel("First name", { exact: false })
      .fill("Preview");
    await reservations.getByLabel("Surname", { exact: false }).fill("Guest");
  }
  await reservations
    .getByLabel("Email address", { exact: false })
    .fill("preview@example.com");
  await reservations
    .getByLabel(isMobile ? "Telephone number" : "Mobile number", {
      exact: false,
    })
    .fill("+353 87 123 4567");
  await reservations
    .getByLabel("Special requests (optional)")
    .fill("Preview only");
  await reservations.getByRole("checkbox", { name: /By confirming/ }).check();
  await reservations
    .getByRole("button", { name: "Confirm Reservation", exact: true })
    .click();

  await expect(
    reservations.getByRole("heading", {
      name: "Your table is booked.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    reservations.getByText(
      "No table has been reserved and no confirmation email has been sent.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    reservations.getByRole("button", { name: "Add to Calendar", exact: true }),
  ).toBeDisabled();
  await expect(
    reservations.getByRole("link", { name: "View Menus", exact: true }),
  ).toHaveAttribute("href", "/menus");
  await expect(
    reservations.getByRole("link", { name: "Plan Your Visit", exact: true }),
  ).toHaveAttribute("href", "/visit-contact");
  expect(submissions).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("booking preview preserves selections on back navigation and resets time when the search changes", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await reservations.getByRole("combobox", { name: "Party size" }).click();
  await reservations
    .getByRole("option", { name: "4 guests", exact: true })
    .click();
  await reservations.getByRole("button", { name: /^Date / }).click();
  await reservations
    .getByRole("button", { name: "Friday, 25 April 2025", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(
    reservations.getByText(
      "Showing times for Friday, 25 April 2025 · 4 guests",
    ),
  ).toBeVisible();
  await reservations
    .getByRole("button", { name: "Show more times (6 more)", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "3:00 pm", exact: true }),
  ).toBeVisible();
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
  await reservations
    .getByLabel("I understand the table is required back by 9:00pm")
    .check();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "7:00 pm", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await reservations
    .getByRole("button", { name: "Edit date & guests", exact: true })
    .click();
  await expect(
    reservations.getByRole("combobox", { name: "Party size" }),
  ).toHaveText("4 guests");
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    reservations.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
});
test("multiword guest names survive typing, back navigation and responsive changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "6:00 pm", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  const firstName = reservations.getByLabel("First name", { exact: false });
  const surname = reservations.getByLabel("Surname", { exact: false });
  const fullName = reservations.getByLabel("Full name", { exact: false });

  await surname.fill("Doyle");
  await firstName.fill("Mary Jane");
  await expect(firstName).toHaveValue("Mary Jane");
  await expect(surname).toHaveValue("Doyle");
  await firstName.fill("");
  await firstName.pressSequentially("Mary Jane");
  await expect(firstName).toHaveValue("Mary Jane");
  await expect(surname).toHaveValue("Doyle");

  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(firstName).toHaveValue("Mary Jane");
  await expect(surname).toHaveValue("Doyle");

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(fullName).toBeVisible();
    await expect(fullName).toHaveValue("Mary Jane Doyle");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(firstName).toHaveValue("Mary Jane");
    await expect(surname).toHaveValue("Doyle");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await fullName.fill("Mary Jane Smith");
  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(fullName).toHaveValue("Mary Jane Smith");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(firstName).toHaveValue("Mary Jane");
  await expect(surname).toHaveValue("Smith");
});

test("extra time selections stay visible after returning from guest details", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Show more times (6 more)", exact: true })
    .click();
  const noon = reservations.getByRole("button", {
    name: "12:00 pm",
    exact: true,
  });
  await noon.click();
  await reservations
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await expect(noon).toBeVisible();
  await expect(noon).toHaveAttribute("aria-pressed", "true");
  await expect(
    reservations.getByRole("button", { name: "Show fewer times", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
});

test("booking help offers the restaurant's contact and group dining destinations", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const main = page.getByRole("main");
  const phoneLinks = main.locator('a[href="tel:+35316763144"]');
  await expect(phoneLinks.first()).toBeVisible();
  for (const link of await phoneLinks.all()) {
    await expect(link).toHaveAttribute("href", "tel:+35316763144");
  }
  const emailLinks = main.locator('a[href="mailto:reception@peploes.ie"]');
  await expect(emailLinks.first()).toBeVisible();
  for (const link of await emailLinks.all()) {
    await expect(link).toHaveAttribute("href", "mailto:reception@peploes.ie");
  }
  const groupsLink = main.getByRole("link", {
    name: "Private Dining & Events",
    exact: true,
  });
  await expect(groupsLink).toHaveAttribute("href", "/private-dining");
  await groupsLink.click();
  await expect(page).toHaveURL("/private-dining");
});

test("booking photographs load without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const images = page.getByRole("main").locator("img:visible");
  await expect(images).not.toHaveCount(0);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        { timeout: 15_000 },
      )
      .toBe(true);
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("party size menu fits the field and supports keyboard selection and dismissal", async ({
  page,
  isMobile,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const partySize = reservations.getByRole("combobox", { name: "Party size" });
  const options = reservations.getByRole("listbox", { name: "Party size" });
  await partySize.click();
  await expect(options).toBeVisible();
  await expect(options.getByRole("option")).toHaveCount(7);
  await expect(
    options.getByRole("option", { name: "2 guests", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const fieldBounds = await partySize.boundingBox();
  const menuBounds = await options.boundingBox();
  expect(fieldBounds).not.toBeNull();
  expect(menuBounds).not.toBeNull();
  if (fieldBounds && menuBounds) {
    expect(Math.abs(menuBounds.x - fieldBounds.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuBounds.width - fieldBounds.width)).toBeLessThanOrEqual(
      1,
    );
    expect(menuBounds.x).toBeGreaterThanOrEqual(0);
    expect(menuBounds.x + menuBounds.width).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  }
  await partySize.press("ArrowDown");
  await partySize.press("Enter");
  await expect(partySize).toHaveText("3 guests");
  await expect(partySize).toBeFocused();
  await expect(options).not.toBeVisible();
  await partySize.press("Space");
  await partySize.press("End");
  await partySize.press("Escape");
  await expect(partySize).toHaveText("3 guests");
  await expect(options).not.toBeVisible();
  await partySize.press("ArrowDown");
  await partySize.press("Home");
  await partySize.press("Enter");
  await expect(partySize).toHaveText("1 guest");
  await partySize.click();
  await partySize.press("7");
  await partySize.press("Enter");
  await expect(partySize).toHaveText("7 guests");
  await partySize.click();
  const fourGuests = options.getByRole("option", {
    name: "4 guests",
    exact: true,
  });
  if (isMobile) await fourGuests.tap();
  else await fourGuests.click();
  await expect(partySize).toHaveText("4 guests");
  await partySize.click();
  await reservations.getByText("Design preview", { exact: false }).click();
  await expect(options).not.toBeVisible();
  await partySize.click();
  await partySize.press("Tab");
  await expect(options).not.toBeVisible();
});

for (const { path, count } of [
  { path: "/", count: 2 },
  { path: "/menus/lunch", count: 1 },
  { path: "/menus/dinner", count: 1 },
  { path: "/menus/pre-theatre", count: 1 },
  { path: "/menus/wine", count: 1 },
  { path: "/menus/cocktails", count: 1 },
  { path: "/visit-contact", count: 3 },
]) {
  test(`all booking calls to action on ${path} open the booking page`, async ({
    page,
  }) => {
    for (let index = 0; index < count; index++) {
      await page.goto(path);
      const main = page.getByRole("main");
      const label = /^(Book a Table|Check Online Availability)$/;
      const links = main.getByRole("link", { name: label });
      await expect(main.getByRole("button", { name: label })).toHaveCount(0);
      await expect(links).toHaveCount(count);
      const link = links.nth(index);
      await expect(link).toHaveAttribute("href", "/book-a-table");
      await expect(link).toBeEnabled();
      await link.click();
      await expect(page).toHaveURL("/book-a-table");
      await expect(
        page.getByRole("heading", { name: "A table at Peploe’s.", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Table reservations" }),
      ).toBeVisible();
    }
  });
}
