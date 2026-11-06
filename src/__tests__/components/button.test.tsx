import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

vi.mock("@/components/ui/button.module.css", () => ({ default: {} }));

function withoutButtonMetadata(html: string) {
  return html
    .replace(/ data-(slot|variant|hover-area)="[^"]*"/g, "")
    .replace(
      /<(\w+)([^>]*)>/g,
      (_, tag, attributes) =>
        `<${tag}${(attributes.match(/ [^\s=]+="[^"]*"/g) ?? []).sort().join("")}>`,
    );
}

describe("shared button", () => {
  it("preserves custom control markup without introducing sizing or icon styles", () => {
    const content = (
      <>
        <svg width="20" height="20" />
        <span>Choose date</span>
      </>
    );
    const props = {
      type: "button" as const,
      className: "calendar-trigger",
      disabled: true,
      "aria-expanded": false,
      "aria-controls": "calendar",
      tabIndex: -1,
    };
    expect(
      withoutButtonMetadata(
        renderToStaticMarkup(
          <Button variant="plain" {...props}>
            {content}
          </Button>,
        ),
      ),
    ).toBe(
      withoutButtonMetadata(
        renderToStaticMarkup(<button {...props}>{content}</button>),
      ),
    );
  });

  it("preserves classless custom controls and their direct children", () => {
    expect(
      withoutButtonMetadata(
        renderToStaticMarkup(
          <Button variant="plain" type="submit" name="choice" value="next">
            Continue
          </Button>,
        ),
      ),
    ).toBe(
      '<button name="choice" type="submit" value="next">Continue</button>',
    );
  });

  it("keeps links and their attributes when using the plain variant", () => {
    expect(
      withoutButtonMetadata(
        renderToStaticMarkup(
          <Button variant="plain" asChild className="custom-link">
            <a href="/menus" target="_blank" rel="noopener noreferrer">
              Menus
            </a>
          </Button>,
        ),
      ),
    ).toBe(
      '<a class="custom-link" href="/menus" rel="noopener noreferrer" target="_blank">Menus</a>',
    );
  });
});
