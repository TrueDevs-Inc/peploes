import "server-only";

import { createClient } from "@sanity/client";
import { ResultAsync } from "neverthrow";

import { MENU_DOCUMENT_TYPES } from "@/lib/constants";
import { ErrorCode } from "@/lib/enums";
import { env } from "@/lib/env";
import { createError } from "@/lib/errors";
import type { IError, TMenuSlug } from "@/lib/types";

const MENU_PROJECTION = `{
  ...,
  "slug": slug.current,
  "image": select(defined(image.asset) => image{..., "src": asset->url}, null),
  "booking": select(defined(booking) => booking{
    ..., "image": image{..., "src": asset->url}
  }, null)
}`;

export function fetchMenu(slug: TMenuSlug): ResultAsync<unknown, IError> {
  return requestContent(
    `*[_type == $type && slug.current == $slug][0..1]${MENU_PROJECTION}`,
    { type: MENU_DOCUMENT_TYPES[slug], slug },
  );
}

export function fetchMenusPage(): ResultAsync<unknown, IError> {
  return requestContent(
    `*[_type == "menusPage" && _id == "menus-page"][0]${MENU_PROJECTION}`,
  );
}

export function fetchMenuCollections(): ResultAsync<unknown, IError> {
  return requestContent(`*[_type == "setMenuCollection" && slug.current in ["group-set-menu", "seasonal"]][0..2]{
    "slug": slug.current, menus[]{_key, title}
  }`);
}

function requestContent(
  query: string,
  params: Record<string, string> = {},
): ResultAsync<unknown, IError> {
  return ResultAsync.fromPromise(fetchContent(query, params), (cause) =>
    createError(ErrorCode.InternalError, "Unable to load menu content.", cause),
  );
}

async function fetchContent(
  query: string,
  params: Record<string, string>,
): Promise<unknown> {
  const client = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    apiVersion: env.SANITY_API_VERSION,
    perspective: "published",
    useCdn: false,
  });
  return await client.fetch<unknown>(query, params, { cache: "no-store" });
}
