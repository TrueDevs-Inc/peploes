import { BookingBanner } from "@/components/app/compounds/booking-banner";
import { GroupsOccasions } from "@/components/app/compounds/groups-occasions";
import { Hero } from "@/components/app/compounds/hero";
import { HumanHospitality } from "@/components/app/compounds/human-hospitality";
import { Menus } from "@/components/app/compounds/menus";
import { RestaurantFeatures } from "@/components/app/compounds/restaurant-features";
import { Stories } from "@/components/app/compounds/stories";
import { WhatsOn } from "@/components/app/compounds/whats-on";
import { Wine } from "@/components/app/compounds/wine";
import { ROUTES } from "@/lib/constants";
import { whatsOnEvents } from "@/lib/constants/whats-on";
import { loadSeasonalEntries } from "@/lib/seasonal-content";
import { seasonalPath } from "@/lib/seasonal-data";

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
    </main>
  );
}
