import "server-only";

import { createClient } from "@sanity/client";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { errAsync, ResultAsync } from "neverthrow";

import {
  JOURNAL_LIMITS,
  MENU_DOCUMENT_TYPES,
  SANITY_CONTENT_CACHE_TAG,
} from "@/lib/constants";
import { ErrorCode, LogContext } from "@/lib/enums";
import { env } from "@/lib/env";
import { createError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { IError, TMenuSlug } from "@/lib/types";

const CONTENT_REVALIDATE_SECONDS = 300;
const CONTENT_LAKE_SETTLE_MS = 3000;

const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: env.SANITY_API_VERSION,
  perspective: "published",
  useCdn: false,
});

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

const JOURNAL_CATEGORY_PROJECTION = `{_id,name,"slug":slug.current}`;
const JOURNAL_CARD_PROJECTION = `{
 _id,_updatedAt,title,"slug":slug.current,standfirst,date,listingOrder,readTimeMinutes,author,
 "category":category->${JOURNAL_CATEGORY_PROJECTION},
 heroImage{alt,desktopPosition,mobilePosition,"src":asset->url},"noIndex":coalesce(noIndex,true)
}`;

export function fetchJournalArticles() {
  // shortcut: client filtering uses at most 500 cards; use paginated reads above that limit.
  // One extra result makes an oversized catalogue fail instead of silently truncating.
  return requestContent(`*[_type == "journalArticle" && enabled != false]
    | order(defined(listingOrder) desc, listingOrder asc, date desc, slug.current asc, _id asc)[0..${JOURNAL_LIMITS.MAX_ARTICLES}]${JOURNAL_CARD_PROJECTION}`);
}

export function fetchRelatedJournalArticles(
  categorySlug: string,
  currentSlug: string,
) {
  return requestContent(
    `*[_type == "journalArticle" && enabled != false
      && category->slug.current == $categorySlug && slug.current != $currentSlug]
      | order(date desc, slug.current asc, _id asc)[0...${JOURNAL_LIMITS.RELATED_ARTICLES}]${JOURNAL_CARD_PROJECTION}`,
    { categorySlug, currentSlug },
  );
}

export function fetchJournalCategories() {
  return requestContent(`*[_type == "journalCategory"]
    | order(coalesce(sortOrder, 999) asc, name asc, slug.current asc, _id asc)[0..${JOURNAL_LIMITS.MAX_CATEGORIES}]${JOURNAL_CATEGORY_PROJECTION}`);
}

export function fetchJournalArticle(slug: string) {
  return requestContent(
    `*[_type == "journalArticle" && enabled != false && slug.current == $slug][0..1]{
    ...${JOURNAL_CARD_PROJECTION},seoDescription,intro,
    blocks[0..${JOURNAL_LIMITS.MAX_BLOCKS}]{_key,_type,text,level,caption,attribution,image{alt,"src":asset->url}}
  }`,
    { slug },
  );
}

export function fetchJournalPage() {
  return requestContent(`*[_type == "journalPage" && _id == "journal-page"][0]{
    title,seoDescription,hero{eyebrow,heading,standfirst,description,image{alt,"src":asset->url}},
    "featuredArticle":select(featuredArticle->_type == "journalArticle" && featuredArticle->enabled != false => featuredArticle->${JOURNAL_CARD_PROJECTION}, null),
    listing,closing{heading,image{alt,"src":asset->url}}
  }`);
}

export function fetchJournalArticleExists(slug: string) {
  return requestContent(
    'count(*[_type == "journalArticle" && enabled != false && slug.current == $slug][0..1])',
    { slug },
  );
}

export function fetchPublishedJournalSlugs() {
  return requestContent(`*[_type == "journalArticle" && enabled != false]
    | order(slug.current asc, _id asc)[0..${JOURNAL_LIMITS.MAX_ARTICLES}]{
      "slug":slug.current,_updatedAt,"noIndex":coalesce(noIndex,true)
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
  return await client.fetch<unknown>(query, params, {
    next: {
      tags: [SANITY_CONTENT_CACHE_TAG],
      revalidate: CONTENT_REVALIDATE_SECONDS,
    },
  });
}

export function verifyPublishWebhook(
  request: Request,
): ResultAsync<void, IError> {
  const secret = env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn(LogContext.Api, "Sanity publish webhook has no secret");
    return errAsync(
      createError(
        ErrorCode.ServiceUnavailable,
        "Content updates are not configured.",
      ),
    );
  }
  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  if (!signature) return errAsync(rejectedWebhook());
  return ResultAsync.fromPromise(
    request.text().then((body) => isValidSignature(body, signature, secret)),
    (cause) => {
      logger.error(LogContext.Api, "Sanity publish webhook check failed", {
        operation: "verifyPublishWebhook",
        reason: cause instanceof Error ? cause.message : String(cause),
      });
      return createError(
        ErrorCode.InternalError,
        "Unable to verify the content update.",
        cause,
      );
    },
  ).andThen((valid) =>
    valid
      ? ResultAsync.fromSafePromise(waitForContentLakeReads())
      : errAsync(rejectedWebhook()),
  );
}

function waitForContentLakeReads(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, CONTENT_LAKE_SETTLE_MS));
}

function rejectedWebhook(): IError {
  return createError(
    ErrorCode.Unauthorized,
    "Invalid content update signature.",
  );
}
