import { notFound } from "next/navigation";

import { SeasonalEvent } from "@/components/app/compounds/seasonal-event";
import { ROUTES } from "@/lib/constants";
import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { SEASONAL_EVENT_CONTENT } from "@/lib/constants/seasonal-event";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return SEASONAL_CONTENT.diary.months.flatMap((month) =>
    month.events.map(({ slug }) => ({ slug })),
  );
}

function validateEventSlug(slug: string) {
  const exists = SEASONAL_CONTENT.diary.months.some((month) =>
    month.events.some((event) => event.slug === slug),
  );

  if (!exists) notFound();
}

export async function generateMetadata({
  params,
}: PageProps<"/seasonal/[slug]">) {
  const { slug } = await params;
  validateEventSlug(slug);

  return buildSeoMetadata({
    title: SEASONAL_EVENT_CONTENT.title,
    description: SEASONAL_EVENT_CONTENT.seoDescription,
    url: `${ROUTES.WHATS_ON}/${slug}`,
    image: SEASONAL_EVENT_CONTENT.hero.image.src,
    imageAlt: SEASONAL_EVENT_CONTENT.hero.image.alt,
    noIndex: true,
  });
}

export default async function SeasonalEventPage({
  params,
}: PageProps<"/seasonal/[slug]">) {
  const { slug } = await params;
  validateEventSlug(slug);

  return <SeasonalEvent />;
}
