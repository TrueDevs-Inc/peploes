import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TableBookingDetails } from "@/components/app/molecules/table-booking-details";
import type { ITableBookingDetailsProps } from "@/lib/types";

vi.mock("@/components/app/compounds/table-booking-panel.module.css", () => ({
  default: {},
}));
vi.mock("@/components/ui/button.module.css", () => ({ default: {} }));

const props: ITableBookingDetailsProps = {
  details: {
    firstName: "Alex",
    surname: "Guest",
    email: "alex@example.com",
    countryCode: "353",
    phone: "871234567",
    requests: "",
    terms: false,
  },
  terms: [],
  sending: false,
  serverErrors: { terms: "Please accept the booking terms." },
  formError: null,
  onChange: () => {},
  onBack: () => {},
  onContinue: () => {},
};

describe("booking terms", () => {
  it("preserves every repeated legal paragraph and its order in rendered terms", () => {
    for (const { terms, paragraphs } of [
      {
        terms: ["Repeated condition.", "Repeated condition."],
        paragraphs: "<p>Repeated condition.</p><p>Repeated condition.</p>",
      },
      {
        terms: ["New condition.", "Repeated condition.", "Repeated condition."],
        paragraphs:
          "<p>New condition.</p><p>Repeated condition.</p><p>Repeated condition.</p>",
      },
    ]) {
      const html = renderToStaticMarkup(
        <TableBookingDetails {...props} terms={terms} />,
      );
      expect(html.match(/<p>Repeated condition\.<\/p>/g)).toHaveLength(2);
      expect(html).toContain(paragraphs);
    }
  });

  it("keeps the terms button outside labels and names the checkbox with the full agreement", () => {
    const html = renderToStaticMarkup(<TableBookingDetails {...props} />);
    const labels = html.match(/<label\b[^>]*>[\s\S]*?<\/label>/g) ?? [];
    expect(labels.some((label) => label.includes("<button"))).toBe(false);
    const checkbox = html.match(/<input[^>]*type="checkbox"[^>]*>/)?.[0] ?? "";
    const id = checkbox.match(/\bid="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`for="${id}"`);
    const labelledBy =
      checkbox.match(/aria-labelledby="([^"]+)"/)?.[1].split(" ") ?? [];
    expect(labelledBy).toHaveLength(2);
    expect(html).toContain(`id="${labelledBy[0]}"`);
    expect(html).toContain(`id="${labelledBy[1]}"`);
    expect(checkbox).toContain('aria-invalid="true"');
    expect(checkbox).toContain('aria-describedby="booking-terms-error"');
    expect(html).toContain('id="booking-terms-error"');
  });
});
