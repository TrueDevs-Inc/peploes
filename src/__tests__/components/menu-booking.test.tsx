import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MenuBooking } from "@/components/app/compounds/menu-booking";
import type { IMenuBooking } from "@/lib/types";

vi.mock("@/lib/fonts", () => ({
  dmSans: { className: "" },
  ebGaramond: { className: "" },
  ebGaramondItalic: { className: "" },
}));

const booking: IMenuBooking = {
  heading: "Join us around the table",
  description: "Our team can help plan your gathering.",
  label: "Enquire about a gathering",
  image: { src: "/table.jpg", alt: "A dining table" },
};

describe("menu booking action", () => {
  it("links to the private enquiry when a destination is available", () => {
    const html = renderToStaticMarkup(
      <MenuBooking booking={{ ...booking, href: "/private-dining#enquire" }} />,
    );
    const links = html.match(/<a\b[^>]*>.*?<\/a>/g) ?? [];

    expect(links).toHaveLength(1);
    expect(links[0]).toContain('href="/private-dining#enquire"');
    expect(links[0]).toContain("Enquire about a gathering");
    expect(links[0]).not.toContain("aria-disabled");
    expect(html).toContain("Join us around the table");
    expect(html).toContain("Our team can help plan your gathering.");
  });

  it("keeps the action inert when no destination is available", () => {
    const html = renderToStaticMarkup(<MenuBooking booking={booking} />);
    const buttons = html.match(/<button\b[^>]*>.*?<\/button>/g) ?? [];

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toContain('type="button"');
    expect(buttons[0]).toContain('aria-disabled="true"');
    expect(buttons[0]).toContain("Enquire about a gathering");
    expect(html).not.toMatch(/<a\b/);
  });
});
