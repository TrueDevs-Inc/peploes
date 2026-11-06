import BaseGatherer from "lighthouse/core/gather/base-gatherer.js";
import { COOKIE_PREFERENCES } from "../src/lib/constants/cookie-consent.ts";

export default class RepresentativeContent extends BaseGatherer {
  meta = { supportedModes: ["navigation"] };

  getArtifact(context) {
    return context.driver.executionContext.evaluate(
      (storageKey) => {
        const main = document.querySelector("main");
        const image = main?.querySelector("img");
        const visible = (element) =>
          Boolean(
            element?.getBoundingClientRect().height &&
              getComputedStyle(element).visibility !== "hidden",
          );
        return {
          heading: main?.querySelector("h1")?.textContent?.trim() ?? "",
          text: main?.textContent?.replace(/\s+/g, " ").trim() ?? "",
          menu:
            main?.querySelector("[data-menu]")?.getAttribute("data-menu") ??
            null,
          heroLoaded: Boolean(image?.complete && image.naturalWidth > 0),
          bookingAvailable: [...(main?.querySelectorAll("button") ?? [])].some(
            (button) =>
              button.textContent?.trim() === "Find a Table" &&
              !button.disabled &&
              visible(button),
          ),
          mapLoaded: visible(main?.querySelector(".mapboxgl-canvas")),
          mapFallbackPresent: visible(
            main?.querySelector('img[src*="peploes-visit-map"]'),
          ),
          consentStored: localStorage.getItem(storageKey) !== null,
        };
      },
      {
        args: [COOKIE_PREFERENCES.storageKey],
        useIsolation: true,
      },
    );
  }
}
