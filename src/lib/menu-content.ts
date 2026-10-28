import "server-only";

import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { MENU_ROUTES, ROUTES } from "@/lib/constants";
import { ErrorCode } from "@/lib/enums";
import { unwrapResultOrThrow } from "@/lib/errors";
import type { IMenuBooking, IMenuNavigationLink, TMenuSlug } from "@/lib/types";
import {
  getMenu,
  getMenuCollections,
  getMenusPage,
} from "@/services/restaurant-menus";

const getCachedMenu = cache(getMenu);
const getCachedMenusPage = cache(getMenusPage);
const getCachedMenuCollections = cache(getMenuCollections);

export async function loadMenu(slug: TMenuSlug) {
  await connection();
  const result = await getCachedMenu(slug);
  if (result.isErr() && result.error.code === ErrorCode.NotFound) notFound();
  return unwrapResultOrThrow(result, "Unable to load the menu.");
}

export async function loadMenusPage() {
  await connection();
  return unwrapResultOrThrow(
    await getCachedMenusPage(),
    "Unable to load menu settings.",
  );
}

export async function loadMenuNavigation(): Promise<IMenuNavigationLink[]> {
  await connection();
  const [page, result] = await Promise.all([
    loadMenusPage(),
    getCachedMenuCollections(),
  ]);
  const collections = unwrapResultOrThrow(
    result,
    "Unable to load menu navigation.",
  );
  return page.navigation.map((item) => {
    const collection = collections.find((menu) => menu.slug === item.menu);
    const href = MENU_ROUTES[item.menu];
    return {
      label: item.label,
      href,
      children: collection?.menus.map((menu) => ({
        label: menu.title,
        href: `${href}#${menu._key}`,
      })),
    };
  });
}

export function getMenuBooking(
  slug: TMenuSlug,
  booking: IMenuBooking,
): IMenuBooking {
  if (slug === "seasonal") return { ...booking, href: undefined };
  if (slug === "group-set-menu")
    return { ...booking, href: `${ROUTES.PRIVATE_DINING}#enquire` };
  return { ...booking, href: ROUTES.BOOK_A_TABLE };
}
