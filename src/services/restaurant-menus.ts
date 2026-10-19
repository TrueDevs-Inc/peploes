import "server-only";

import { err, ok, type Result } from "neverthrow";
import { z } from "zod";

import {
  cmsMenuSchema,
  menuCollectionNavigationSchema,
  menusPageSchema,
} from "@/lib/cms-menu-schema";
import { MENU_ROUTES, MENU_SLUGS } from "@/lib/constants";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { ErrorCode } from "@/lib/enums";
import { createError } from "@/lib/errors";
import {
  fetchMenu,
  fetchMenuCollections,
  fetchMenusPage,
} from "@/lib/sanity-provider";
import type {
  IError,
  TCmsMenu,
  TMenuCollections,
  TMenuSlug,
  TMenusPageDocument,
} from "@/lib/types";

export async function getMenu(
  slug: TMenuSlug,
): Promise<Result<TCmsMenu, IError>> {
  const result = await fetchMenu(slug);
  if (result.isErr()) return err(result.error);

  const documents = z.array(z.unknown()).safeParse(result.value);
  if (!documents.success)
    return err(createError(ErrorCode.InternalError, "Invalid menu response."));
  if (documents.data.length === 0)
    return err(createError(ErrorCode.NotFound, "This menu was not found."));
  if (documents.data.length !== 1)
    return err(
      createError(
        ErrorCode.InternalError,
        "More than one published menu uses this URL name.",
      ),
    );

  const parsed = cmsMenuSchema.safeParse(documents.data[0]);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "The menu content could not be loaded.",
        parsed.error,
      ),
    );
  if (parsed.data.slug !== slug)
    return err(
      createError(ErrorCode.InternalError, "The menu URL does not match."),
    );
  return ok(parsed.data);
}

export async function getMenusPage(): Promise<
  Result<TMenusPageDocument, IError>
> {
  const result = await fetchMenusPage();
  if (result.isErr()) return err(result.error);
  if (result.value === null) return ok(defaultMenuSettings());
  const parsed = menusPageSchema.safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Publish the shared menu settings before opening the menus.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

export async function getMenuCollections(): Promise<
  Result<TMenuCollections, IError>
> {
  const result = await fetchMenuCollections();
  if (result.isErr()) return err(result.error);
  const parsed = menuCollectionNavigationSchema.safeParse(result.value);
  if (!parsed.success)
    return err(
      createError(
        ErrorCode.InternalError,
        "Unable to load menu navigation.",
        parsed.error,
      ),
    );
  return ok(parsed.data);
}

function defaultMenuSettings(): TMenusPageDocument {
  return {
    ...MENU_PAGE_CONTENT,
    navigation: MENU_SLUGS.map((menu) => ({
      menu,
      label:
        MENU_PAGE_CONTENT.navigation.find(
          (link) => link.href === MENU_ROUTES[menu],
        )?.label ?? menu,
    })),
  };
}
