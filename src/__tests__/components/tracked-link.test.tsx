import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { TrackedAnchor } from "@/components/app/atoms/tracked-link";
import { GA4Event } from "@/lib/enums";

const track = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics/client", () => ({ trackCustomEvent: track }));

describe("TrackedAnchor", () => {
  it("reports closed identifiers, never the tel: destination, and keeps the caller's handler", () => {
    const onClick = vi.fn();
    const element = TrackedAnchor({
      href: "tel:+441311234567",
      interaction: {
        event: GA4Event.ContactClick,
        placement: "footer",
        destination: "phone",
      },
      onClick,
      children: "Call",
    });
    expect(isValidElement(element)).toBe(true);
    const props = (element as { props: { onClick: (e: unknown) => void } })
      .props;
    props.onClick({});
    expect(track).toHaveBeenCalledWith("contact_click", {
      placement: "footer",
      destination: "phone",
    });
    expect(JSON.stringify(track.mock.calls)).not.toContain("tel:");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
