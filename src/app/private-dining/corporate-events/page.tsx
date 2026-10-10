import { PrivateDiningCorporate } from "@/components/app/compounds/private-dining-corporate";
import { ROUTES } from "@/lib/constants";
import { CORPORATE_EVENTS } from "@/lib/constants/private-dining-corporate";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: CORPORATE_EVENTS.title,
  description: CORPORATE_EVENTS.seoDescription,
  url: ROUTES.CORPORATE_EVENTS,
  image: CORPORATE_EVENTS.hero.image.src,
  imageAlt: CORPORATE_EVENTS.hero.image.alt,
});

export default function CorporateEventsPage() {
  return <PrivateDiningCorporate />;
}
