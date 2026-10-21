import { DrinksMenu } from "@/components/app/compounds/drinks-menu";
import { RestaurantMenu } from "@/components/app/compounds/restaurant-menu";
import { SetMenuCollection } from "@/components/app/compounds/set-menu-collection";
import { WineMenu } from "@/components/app/compounds/wine-menu";
import { MENU_ROUTES } from "@/lib/constants";
import { getMenuBooking, loadMenu, loadMenusPage } from "@/lib/menu-content";
import { buildSeoMetadata } from "@/lib/seo";
import type { ICmsMenuPageProps, TMenuSlug } from "@/lib/types";

export async function CmsMenuPage({ slug }: ICmsMenuPageProps) {
  const [menu, settings] = await Promise.all([loadMenu(slug), loadMenusPage()]);
  const booking = getMenuBooking(slug, menu.booking ?? settings.booking);
  switch (menu._type) {
    case "restaurantMenu":
      return <RestaurantMenu menu={{ ...menu, booking }} />;
    case "wineMenu":
      return <WineMenu menu={{ ...menu, booking }} />;
    case "drinksMenu":
      return <DrinksMenu menu={{ ...menu, booking }} />;
    case "setMenuCollection":
      return <SetMenuCollection menu={{ ...menu, booking }} />;
  }
}

export async function getMenuMetadata(slug: TMenuSlug) {
  const [menu, settings] = await Promise.all([loadMenu(slug), loadMenusPage()]);
  const image = menu.image ?? settings.image;
  return buildSeoMetadata({
    title: menu.title,
    description: menu.seoDescription,
    url: MENU_ROUTES[slug],
    image: image.src,
    imageAlt: image.alt,
  });
}
