import type { ITimesData, TBookingResponse } from "../src/lib/types";

import {
  addDays,
  dayLabel,
  dublinToday,
  freeDates,
  openDates,
  shortDayLabel,
} from "./booking-fixtures";
import {
  chooseDate,
  chooseGuests,
  findTable,
  laterFreeDate,
  openBooking,
} from "./booking-page";
import { expect, test } from "./menu-test";

test("accepting another time's required deadline replaces the previous acceptance", async ({
  page,
}) => {
  await page.route("**/api/bookings/times?**", async (route) => {
    const response = await route.fetch();
    const reply: TBookingResponse<ITimesData> = await response.json();
    if (!reply.ok) throw new Error("Expected available booking times");
    await route.fulfill({
      response,
      json: {
        ...reply,
        data: {
          ...reply.data,
          times: reply.data.times
            .filter((slot) => ["18:00", "19:00"].includes(slot.time))
            .map((slot) => ({
              ...slot,
              offers: slot.offers.map((offer) => ({
                ...offer,
                returnBy: offer.returnBy && {
                  ...offer.returnBy,
                  required: true,
                },
              })),
            })),
        },
      },
    });
  });
  const reservations = await openBooking(page);
  await chooseDate(reservations, laterFreeDate());
  await findTable(reservations);
  const first = reservations.getByRole("button", {
    name: "7:00 pm",
    exact: true,
  });
  const second = reservations.getByRole("button", {
    name: "6:00 pm",
    exact: true,
  });
  const firstDeadline = reservations.getByRole("checkbox", {
    name: "I understand the table is required back by 9:00 pm",
    exact: true,
  });
  const secondDeadline = reservations.getByRole("checkbox", {
    name: "I understand the table is required back by 8:00 pm",
    exact: true,
  });
  const continueButton = reservations.getByRole("button", {
    name: "Continue",
    exact: true,
  });

  await first.click();
  await expect(firstDeadline).not.toBeChecked();
  await expect(continueButton).toBeDisabled();
  await firstDeadline.check();
  await expect(continueButton).toBeEnabled();
  await second.click();
  await expect(secondDeadline).not.toBeChecked();
  await expect(continueButton).toBeDisabled();
  await secondDeadline.check();
  await expect(continueButton).toBeEnabled();
  await first.click();
  await expect(firstDeadline).not.toBeChecked();
  await expect(continueButton).toBeDisabled();
});

for (const restored of [false, true]) {
  test(`a ${restored ? "restored" : "new"} optional-deadline hold does not accept another time's required deadline`, async ({
    page,
  }) => {
    const reservations = await openBooking(page);
    await chooseDate(reservations, laterFreeDate());
    await findTable(reservations);
    await reservations
      .getByRole("button", { name: "6:00 pm", exact: true })
      .click();
    await expect(
      reservations.getByText("Table until 8:00 pm", { exact: true }),
    ).toBeVisible();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await expect(reservations.getByRole("timer")).toBeVisible();
    if (restored) {
      await page.reload();
      await expect(reservations.getByRole("timer")).toBeVisible();
    }
    await reservations
      .getByRole("button", { name: "Back to times", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "7:00 pm", exact: true })
      .click();
    const deadline = reservations.getByRole("checkbox", {
      name: "I understand the table is required back by 9:00 pm",
      exact: true,
    });
    const continueButton = reservations.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    await expect(deadline).not.toBeChecked();
    await expect(continueButton).toBeDisabled();
    await deadline.check();
    await expect(continueButton).toBeEnabled();
  });
}

test("an after-midnight hold shows its calendar day and restores the same reservation", async ({
  page,
}) => {
  const panel = await openBooking(page);
  await chooseGuests(panel, 1);
  const evening = laterFreeDate(1);
  const visit = addDays(evening, 1);
  await chooseDate(panel, evening);
  await findTable(panel);
  await panel
    .getByRole("button", { name: "12:15 am (next day)", exact: true })
    .click();
  await panel.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(panel.getByRole("timer")).toBeVisible();
  await expect(
    panel.getByText(shortDayLabel(visit), { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(panel.getByRole("timer")).toBeVisible();
  await expect(
    panel.getByText(shortDayLabel(visit), { exact: false }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Edit date & guests", exact: true })
    .click();
  await chooseGuests(panel, 2);
  await expect(
    panel.getByText(
      `No tables for 2 guests on ${shortDayLabel(evening)}. Please choose another day.`,
      { exact: true },
    ),
  ).toBeVisible();
});

test("desktop booking keeps the panel in place when opening available times", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  const findTable = reservations.getByRole("button", {
    name: "Find a Table",
    exact: true,
  });
  await findTable.scrollIntoViewIfNeeded();
  const initialBounds = await reservations.boundingBox();
  expect(initialBounds).not.toBeNull();

  await findTable.click();
  await expect(
    reservations.getByRole("heading", { name: "Available times", exact: true }),
  ).toBeVisible();
  await expect(reservations).toBeFocused();
  const timesBounds = await reservations.boundingBox();
  expect(timesBounds).not.toBeNull();
  if (initialBounds && timesBounds) {
    expect(Math.abs(timesBounds.y - initialBounds.y)).toBeLessThanOrEqual(1);
  }
});

test("booking calendar omits elapsed weeks and keeps remaining dates selectable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const panel = await openBooking(page);
  const field = panel.getByRole("button", { name: /^Date / });
  await expect(field).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await field.click();
  const calendar = panel.getByRole("group", {
    name: "Choose date",
    exact: true,
  });
  const today = dublinToday();
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const previousSunday = addDays(today, -(weekday || 7));
  await expect(
    calendar.getByRole("button", {
      name: dayLabel(previousSunday),
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    await calendar.evaluate(
      (element) => element.scrollHeight <= element.clientHeight,
    ),
  ).toBe(true);
  const chosen = laterFreeDate();
  await calendar
    .getByRole("button", { name: dayLabel(chosen), exact: true })
    .click();
  await expect(field).toHaveText(shortDayLabel(chosen));
});

test("booking refreshes expired dates on search, focus and visibility while keeping future choices", async ({
  page,
}) => {
  const panel = await openBooking(page);
  const date = panel.getByRole("button", { name: /^Date / });
  const chosen = laterFreeDate();
  await chooseDate(panel, chosen);
  await page.clock.setFixedTime(new Date(`${addDays(chosen, 1)}T12:00:00Z`));
  await panel
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(date).toHaveText(shortDayLabel(addDays(chosen, 1)));
  await expect(
    panel.getByRole("button", { name: "Find a Table", exact: true }),
  ).toBeVisible();
  await date.click();
  const calendar = panel.getByRole("group", {
    name: "Choose date",
    exact: true,
  });
  await expect(
    calendar.getByRole("button", { name: dayLabel(chosen), exact: true }),
  ).toBeDisabled();
  const future = freeDates(dublinToday(), 4).find(
    (day) => day > addDays(chosen, 3),
  );
  if (!future) throw new Error("Fixture needs a future open date");
  await calendar
    .getByRole("button", { name: dayLabel(future), exact: true })
    .click();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(date).toHaveText(shortDayLabel(future));
  await page.clock.setFixedTime(new Date(`${addDays(future, 1)}T12:00:00Z`));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(date).toHaveText(shortDayLabel(addDays(future, 1)));
  await page.clock.setFixedTime(new Date(`${addDays(future, 2)}T12:00:00Z`));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(date).toHaveText(shortDayLabel(addDays(future, 2)));
});

test("booking brings hidden step controls back into view on forward and back navigation", async ({
  page,
}) => {
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseDate(reservations, laterFreeDate());
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "6:00 pm", exact: true })
    .click();

  for (const name of ["Continue", "Back to times"]) {
    const action = reservations.getByRole("button", { name, exact: true });
    await action.scrollIntoViewIfNeeded();
    await action.click();
    await expect(reservations).toBeFocused();
    await expect
      .poll(() =>
        reservations.evaluate((element) => element.getBoundingClientRect().top),
      )
      .toBeGreaterThanOrEqual(99);
    await expect(
      reservations.getByRole("list", { name: "Booking progress" }),
    ).toBeInViewport();
  }
});

for (const activation of ["click", "Enter", "Space"]) {
  test(`booking terms open by ${activation} without changing agreement or leaving the form`, async ({
    page,
    context,
  }) => {
    let popups = 0;
    page.on("popup", () => {
      popups += 1;
    });
    await page.goto("/book-a-table");
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    await chooseDate(reservations, laterFreeDate());
    await reservations
      .getByRole("button", { name: "Find a Table", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "6:00 pm", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    const agreement = reservations.getByRole("checkbox", {
      name: /By confirming/,
    });
    const terms = reservations.getByRole("button", {
      name: "Peploe’s Booking & Cancellation Terms.",
      exact: true,
    });
    const dialog = page.getByRole("dialog", {
      name: "Booking & Cancellation Terms",
      exact: true,
    });
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    const tabs = context.pages().length;
    await expect(terms).toHaveAttribute("type", "button");
    await expect(agreement).toHaveAccessibleName(
      "By confirming, you agree to Peploe’s Booking & Cancellation Terms.",
    );
    const agreementLabel = reservations.getByText(
      "By confirming, you agree to",
      {
        exact: true,
      },
    );
    await agreementLabel.click();
    await expect(agreement).toBeChecked();
    await expect(dialog).toBeHidden();
    await agreementLabel.click();
    await expect(agreement).not.toBeChecked();
    await expect(dialog).toBeHidden();

    for (const accepted of [false, true]) {
      await agreement.setChecked(accepted);
      for (const dismissal of ["Close", "Escape"]) {
        if (activation === "click") {
          await terms.click();
        } else {
          await terms.focus();
          await terms.press(activation);
        }
        await expect(dialog).toBeVisible();
        const paragraphs = dialog.getByText("Browser test booking terms.", {
          exact: true,
        });
        await expect(paragraphs).toHaveCount(2);
        await expect(paragraphs.nth(0)).toBeVisible();
        await expect(paragraphs.nth(1)).toBeVisible();
        await expect(
          dialog.getByRole("heading", {
            name: "Booking & Cancellation Terms",
            exact: true,
          }),
        ).toBeFocused();
        await expect(agreement).toBeChecked({ checked: accepted });
        await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
        if (dismissal === "Close") {
          await close.click();
        } else {
          await page.keyboard.press("Escape");
        }
        await expect(dialog).not.toBeVisible();
        await expect(terms).toBeFocused();
        await expect(agreement).toBeChecked({ checked: accepted });
        await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
        await expect(page).toHaveURL("/book-a-table");
        await expect(
          reservations.getByRole("button", {
            name: "Confirm Reservation",
            exact: true,
          }),
        ).toBeVisible();
        expect(popups).toBe(0);
        expect(context.pages()).toHaveLength(tabs);
      }
    }
  });
}

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

    await menu.getByRole("link", { name: "Book A Table", exact: true }).click();

    await expect(page).toHaveURL("/book-a-table");
    await expect(menu).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});
for (const newsletterOptIn of [false, true]) {
  test(`connected booking completes with newsletter opt-in ${newsletterOptIn}`, async ({
    page,
    isMobile,
  }) => {
    const submissions: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") submissions.push(request.url());
    });
    await page.goto("/book-a-table");
    const reservations = page.getByRole("region", {
      name: "Table reservations",
    });
    const previewNotice = reservations.getByText(
      /Booking preview|no reservation (?:is|was) made/i,
    );
    await expect(previewNotice).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    await chooseDate(reservations, laterFreeDate());
    await reservations
      .getByRole("button", { name: "Find a Table", exact: true })
      .click();
    await expect(
      reservations.getByRole("heading", {
        name: "Available times",
        exact: true,
      }),
    ).toBeVisible();
    await expect(previewNotice).toHaveCount(0);
    await expect(
      reservations.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
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
      .getByRole("button", { name: "Confirm Reservation", exact: true })
      .click();
    await expect(
      reservations
        .getByText("Please enter your name.", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(previewNotice).toHaveCount(0);
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
      .fill("087 123 4567");
    await reservations
      .getByLabel("Special requests (optional)")
      .fill("Preview only");
    const newsletter = reservations.getByRole("checkbox", {
      name: "Email me news and updates from Peploe’s (optional)",
    });
    await expect(newsletter).not.toBeChecked();
    await newsletter.focus();
    await newsletter.press("Space");
    await expect(newsletter).toBeChecked();
    await expect(
      reservations.getByRole("checkbox", { name: /By confirming/ }),
    ).not.toBeChecked();
    await reservations
      .getByRole("button", { name: "Back to times", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await expect(newsletter).toBeChecked();
    await newsletter.setChecked(newsletterOptIn);
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
      reservations
        .locator("p", { hasText: "Booking reference" })
        .locator("strong"),
    ).toHaveText(/^E2EBK\d{4}$/);
    await expect(previewNotice).toHaveCount(0);
    await expect(
      reservations.getByRole("button", {
        name: "Add to Calendar",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      reservations.getByRole("link", { name: "View Menus", exact: true }),
    ).toHaveAttribute("href", "/menus");
    await expect(
      reservations.getByRole("link", { name: "Plan Your Visit", exact: true }),
    ).toHaveAttribute("href", "/contact");
    expect(submissions).toHaveLength(3);
    await reservations
      .getByRole("button", { name: "Start again", exact: true })
      .click();
    await chooseDate(reservations, laterFreeDate());
    await reservations
      .getByRole("button", { name: "Find a Table", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "6:00 pm", exact: true })
      .click();
    await reservations
      .getByRole("button", { name: "Continue", exact: true })
      .click();
    await expect(newsletter).not.toBeChecked();
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
}

test("booking preview preserves selections on back navigation and resets time when the search changes", async ({
  page,
}) => {
  const date = openDates(dublinToday())[1] ?? "";
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await reservations.getByRole("combobox", { name: "Party size" }).click();
  await reservations
    .getByRole("option", { name: "3 guests", exact: true })
    .click();
  await chooseDate(reservations, date);
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await expect(
    reservations.getByText(`Showing times for ${dayLabel(date)} · 3 guests`),
  ).toBeVisible();
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
    .getByRole("button", { name: "Back to times", exact: true })
    .click();
  await expect(
    reservations.getByRole("button", { name: "7:00 pm", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    reservations.getByLabel(
      "I understand the table is required back by 9:00 pm",
    ),
  ).toBeChecked();
  await reservations
    .getByRole("button", { name: "Edit date & guests", exact: true })
    .click();
  await expect(
    reservations.getByRole("combobox", { name: "Party size" }),
  ).toHaveText("3 guests");
  await reservations
    .getByRole("button", { name: "Find a Table", exact: true })
    .click();
  await reservations
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
  await expect(
    reservations.getByLabel(
      "I understand the table is required back by 9:00 pm",
    ),
  ).not.toBeChecked();
  await expect(
    reservations.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(reservations.getByRole("timer")).toHaveText(
    /^Table held for \d:\d{2}$/,
  );
});
test("multiword guest names survive typing, back navigation and responsive changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/book-a-table");
  const reservations = page.getByRole("region", { name: "Table reservations" });
  await chooseDate(reservations, laterFreeDate());
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
  const emailLinks = main.locator('a[href="mailto:reception@peploes.com"]');
  await expect(emailLinks.first()).toBeVisible();
  for (const link of await emailLinks.all()) {
    await expect(link).toHaveAttribute("href", "mailto:reception@peploes.com");
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
  await expect(options.getByRole("option")).toHaveCount(6);
  await expect(
    options.getByRole("option", { name: "4 guests", exact: true }),
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
  await expect(partySize).toHaveText("5 guests");
  await expect(partySize).toBeFocused();
  await expect(options).not.toBeVisible();
  await partySize.press("Space");
  await partySize.press("End");
  await partySize.press("Escape");
  await expect(partySize).toHaveText("5 guests");
  await expect(options).not.toBeVisible();
  await partySize.press("ArrowDown");
  await partySize.press("Home");
  await partySize.press("Enter");
  await expect(partySize).toHaveText("1 guest");
  await partySize.click();
  await partySize.press("6");
  await partySize.press("Enter");
  await expect(partySize).toHaveText("6 guests");
  await partySize.click();
  const fourGuests = options.getByRole("option", {
    name: "4 guests",
    exact: true,
  });
  if (isMobile) await fourGuests.tap();
  else await fourGuests.click();
  await expect(partySize).toHaveText("4 guests");
  await partySize.click();
  await reservations.getByRole("list", { name: "Booking progress" }).click();
  await expect(options).not.toBeVisible();
  await partySize.click();
  await partySize.press("Tab");
  await expect(options).not.toBeVisible();
});

for (const { path, count } of [
  { path: "/", count: 2 },
  { path: "/menus?menu=lunch", count: 1 },
  { path: "/menus?menu=dinner", count: 1 },
  { path: "/menus?menu=pre-theatre", count: 1 },
  { path: "/menus?menu=wine", count: 1 },
  { path: "/menus?menu=cocktails", count: 1 },
  { path: "/contact", count: 3 },
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
