import { describe, expect, it } from "vitest";
import { cmsMenuSchema } from "@/lib/cms-menu-schema";
import { COCKTAILS_MENU } from "@/lib/constants/cocktails-menu";
import { DINNER_MENU } from "@/lib/constants/dinner-menu";
import { GROUP_SET_MENU } from "@/lib/constants/group-set-menu";
import { PRE_THEATRE_MENU } from "@/lib/constants/pre-theatre-menu";
import { SEASONAL_MENU } from "@/lib/constants/seasonal-menu";
import { WINE_MENU } from "@/lib/constants/wine-menu";
import type { IMenuEditorialContent } from "@/lib/types";

function readPublishedMenu(content: IMenuEditorialContent, type: string) {
  const document: unknown = JSON.parse(
    JSON.stringify({ ...content, _type: type }, (key, value) =>
      key === "src"
        ? "https://cdn.sanity.io/images/testproject/development/photo-800x600.jpg"
        : value,
    ),
  );
  return cmsMenuSchema.parse(document);
}

describe("published menu presentation", () => {
  it("preserves the existing image, banner, wine and price presentation", () => {
    const dinner = readPublishedMenu(DINNER_MENU, "restaurantMenu");
    const theatre = readPublishedMenu(PRE_THEATRE_MENU, "restaurantMenu");
    const cocktails = readPublishedMenu(COCKTAILS_MENU, "drinksMenu");
    const group = readPublishedMenu(GROUP_SET_MENU, "setMenuCollection");
    const seasonal = readPublishedMenu(SEASONAL_MENU, "setMenuCollection");
    const wine = readPublishedMenu(WINE_MENU, "wineMenu");

    expect(dinner.image).toMatchObject({
      desktopCrop: {
        widthPercent: 72.662253,
        aspectRatio: 1.666666608,
        leftPercent: 43.6941,
        topPx: -207.6,
        rotationDegrees: 10.7862,
      },
    });
    expect(theatre.image).toMatchObject({ rotation: -23, desktopScale: 1.193 });
    expect(cocktails.image).toMatchObject({
      desktopPosition: "center 87.3%",
      mobilePosition: "center 70.6%",
    });
    expect(cocktails.booking).toMatchObject({
      tallOnMobile: true,
      mobilePadding: 54,
      image: { desktopPosition: "50% 79.3%" },
    });
    expect(group).toMatchObject({
      inclusionsHeading: "Included with your menu",
      booking: {
        desktopContentWidth: 300,
        desktopTextAlign: "left",
        fullWidthOnMobile: true,
        mobilePadding: 45,
      },
    });
    expect(seasonal.booking).toMatchObject({
      desktopContentWidth: 390,
      desktopTextAlign: "left",
      mobilePadding: 14,
      desktopOverlay:
        "linear-gradient(90deg,rgba(15,13,12,0.101961),rgba(15,13,12,0.470588) 37.0192%,rgb(15,13,12))",
    });
    expect(wine.booking).toMatchObject({
      tallOnMobile: true,
      mobilePadding: 44,
      mobileOverlay:
        "linear-gradient(180deg,rgba(32,16,9,0.031373),rgba(32,16,9,0.9) 49.9345%,rgba(32,16,9,0.941176))",
    });
    if (wine._type !== "wineMenu" || cocktails._type !== "drinksMenu")
      throw new Error("Unexpected menu type");
    expect(
      wine.sections.find((section) => section._key === "sparkling-rose"),
    ).toMatchObject({ desktopBottomPadding: 80, mobileBottomPadding: 10 });
    const categories = wine.sections.flatMap((section) =>
      section.columns.flatMap((column) => column.categories),
    );
    expect(
      categories.find(
        (category) => category._key === "peploes-ultimate-selection",
      ),
    ).toMatchObject({
      shortHeading: "Ultimate Selection",
      compactVintageHeading: true,
      emphasized: true,
    });
    expect(
      categories.find((category) => category._key === "house-wines"),
    ).toMatchObject({ mobileTopPadding: 40 });
    expect(
      categories.find((category) => category._key === "sweet-wines-ports"),
    ).toMatchObject({ mobileHeadingGap: 11 });
    expect(
      cocktails.spirits
        .flatMap((section) => section.dishes)
        .find((dish) => dish._key === "hennessy-paradis-imperial-7"),
    ).toMatchObject({ price: 375, priceDecimalPlaces: 0 });
  });
});
