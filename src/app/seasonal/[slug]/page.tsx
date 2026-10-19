import { SeasonalEvent } from "@/components/app/compounds/seasonal-event";
import { loadSeasonalEntry, loadWhatsOnPage } from "@/lib/seasonal-content";
import { getSeasonalEventContent, seasonalPath } from "@/lib/seasonal-data";
import { buildSeoMetadata } from "@/lib/seo";
import type { ISeasonalRouteProps } from "@/lib/types";

export async function generateMetadata({ params }: ISeasonalRouteProps) {
  const { slug } = await params;
  const content = await loadSeasonalEntry(slug);
  return buildSeoMetadata({
    title: content.title,
    description: content.seoDescription,
    url: seasonalPath(content.slug),
    image: content.hero.image.src,
    imageAlt: content.hero.image.alt,
    noIndex: content.noIndex,
  });
}
export default async function SeasonalEventPage({
  params,
}: ISeasonalRouteProps) {
  const { slug } = await params;
  const [entry, settings] = await Promise.all([
    loadSeasonalEntry(slug),
    loadWhatsOnPage(),
  ]);
  return (
    <SeasonalEvent
      content={getSeasonalEventContent(entry)}
      join={settings.join}
    />
  );
}
