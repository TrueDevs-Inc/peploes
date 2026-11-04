import { BookingBanner } from "@/components/app/compounds/booking-banner";
import { GroupsOccasions } from "@/components/app/compounds/groups-occasions";
import { Hero } from "@/components/app/compounds/hero";
import { HumanHospitality } from "@/components/app/compounds/human-hospitality";
import { Menus } from "@/components/app/compounds/menus";
import { NewsletterPopup } from "@/components/app/compounds/newsletter-popup";
import { RestaurantFeatures } from "@/components/app/compounds/restaurant-features";
import { Stories } from "@/components/app/compounds/stories";
import { WhatsOn } from "@/components/app/compounds/whats-on";
import { Wine } from "@/components/app/compounds/wine";
import { DEFAULT_SEO, ROUTES } from "@/lib/constants";
import { HERO_CONTENT } from "@/lib/constants/hero";
import { whatsOnEvents } from "@/lib/constants/whats-on";
import { loadSeasonalEntries } from "@/lib/seasonal-content";
import { seasonalPath } from "@/lib/seasonal-data";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: `${DEFAULT_SEO.siteName} | A Dublin Restaurant on St Stephen's Green`,
  description: `${DEFAULT_SEO.description} ${HERO_CONTENT.description}`,
  url: ROUTES.HOME,
  image: HERO_CONTENT.entranceImage.src,
  imageAlt: HERO_CONTENT.entranceImage.alt,
  imageWidth: 1452,
  imageHeight: 1407,
});

export default async function Home() {
  const entries = await loadSeasonalEntries();
  const publishedPaths = new Set<string>(
    entries.map((entry) => seasonalPath(entry.slug)),
  );
  const events = whatsOnEvents.map((event) => ({
    ...event,
    href: publishedPaths.has(event.href) ? event.href : ROUTES.WHATS_ON,
  }));
  return (
    <main>
      <Hero />
      <RestaurantFeatures />
      <Menus />
      <WhatsOn events={events} />
      <Wine />
      <Stories />
      <GroupsOccasions />
      <HumanHospitality />
      <BookingBanner />
      <NewsletterPopup />
    </main>
  );
}
