import { Suspense } from "react";
import { Seasonal } from "@/components/app/compounds/seasonal";
import { ROUTES } from "@/lib/constants";
import { loadSeasonalEntries, loadWhatsOnPage } from "@/lib/seasonal-content";
import {
  groupSeasonalEntries,
  restaurantToday,
  upcomingSeasonalEntries,
} from "@/lib/seasonal-data";
import { buildSeoMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await loadWhatsOnPage();
  return buildSeoMetadata({
    title: content.title,
    description: content.seoDescription,
    url: ROUTES.WHATS_ON,
    image: content.hero.image.src,
    imageAlt: content.hero.image.alt,
  });
}
export default function SeasonalPage() {
  return (
    <Suspense fallback={null}>
      <PublishedSeasonalPage />
    </Suspense>
  );
}
async function PublishedSeasonalPage() {
  const [content, entries] = await Promise.all([
    loadWhatsOnPage(),
    loadSeasonalEntries(),
  ]);
  const today = restaurantToday();
  const upcoming = upcomingSeasonalEntries(entries, today);
  return <Seasonal content={content} months={groupSeasonalEntries(upcoming)} />;
}
