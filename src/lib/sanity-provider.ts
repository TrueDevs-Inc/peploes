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

const SEASONAL_CARD_PROJECTION = `{
 _id,_updatedAt,kind,title,"slug":slug.current,date,endDate,category,summary,action,"noIndex":coalesce(noIndex,true),
 hero{...,image{alt,"src":asset->url}}
}`;
const SEASONAL_ENTRY_PROJECTION = `{
 ...,"slug":slug.current,
 hero{...,image{alt,"src":asset->url}},
 menu{..., "cards": cards[_type == "seasonalMenuHighlight" || defined(href) || !defined(menu) || defined(menu->slug.current)]{
  ...,"href":coalesce(href,select(defined(menu->slug.current) => "/menus?menu=" + menu->slug.current)),image{alt,"src":asset->url}
 }},
 story{...,image{alt,"src":asset->url}},
 gallery{...,images[]{_key,alt,"src":asset->url}},
 invitation{...,image{alt,"src":asset->url}},
 related{..., "cards": cards[_type == "seasonalRelatedPage" || (@->enabled != false && defined(@->slug.current))]{
  ...select(
    _type == "seasonalRelatedPage" => {_type,_key,title,description,action,href,image{alt,"src":asset->url}},
    @->${SEASONAL_CARD_PROJECTION}
  )
 }}
}`;
export function fetchSeasonalEntries() {
  return requestContent(
    `*[_type == "seasonalEntry" && enabled != false] | order(date asc, title asc)${SEASONAL_CARD_PROJECTION}`,
  );
}
export function fetchSeasonalEntryExists(slug: string) {
  return requestContent(
    'defined(*[_type == "seasonalEntry" && enabled != false && slug.current == $slug][0]._id)',
    { slug },
  );
}

export function fetchSeasonalEntry(slug: string) {
  return requestContent(
    `*[_type == "seasonalEntry" && enabled != false && slug.current == $slug][0..1]${SEASONAL_ENTRY_PROJECTION}`,
    { slug },
  );
}
export function fetchWhatsOnPage() {
  return requestContent(`*[_type == "whatsOnPage" && _id == "whats-on-page"][0]{
  ...,hero{...,image{alt,"src":asset->url}},
  terrace{...,image{alt,"src":asset->url}},
  join{...,image{alt,"src":asset->url}}
 }`);
}

function requestContent(
  query: string,
  params: Record<string, string> = {},
): ResultAsync<unknown, IError> {
  return ResultAsync.fromPromise(fetchContent(query, params), (cause) =>
    createError(ErrorCode.InternalError, "Unable to load CMS content.", cause),
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
