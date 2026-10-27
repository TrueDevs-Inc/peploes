import { JsonLd } from "@/components/app/atoms/json-ld";
import { PrivateDiningCorporate } from "@/components/app/compounds/private-dining-corporate";
import { ROUTES } from "@/lib/constants";
import { PRIVATE_DINING } from "@/lib/constants/private-dining";
import { CORPORATE_EVENTS } from "@/lib/constants/private-dining-corporate";
import { buildSeoMetadata, getSectionBreadcrumbSchema } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: CORPORATE_EVENTS.title,
  description: CORPORATE_EVENTS.seoDescription,
  url: ROUTES.CORPORATE_EVENTS,
  image: CORPORATE_EVENTS.hero.image.src,
  imageAlt: CORPORATE_EVENTS.hero.image.alt,
});

export default function CorporateEventsPage() {
  return (
    <>
      <JsonLd
        data={getSectionBreadcrumbSchema(
          { name: PRIVATE_DINING.title, url: ROUTES.PRIVATE_DINING },
          { name: CORPORATE_EVENTS.title, url: ROUTES.CORPORATE_EVENTS },
        )}
      />
      <PrivateDiningCorporate />
    </>
  );
}
