import { JsonLd } from "@/components/app/atoms/json-ld";
import { PrivateDiningWeddings } from "@/components/app/compounds/private-dining-weddings";
import { ROUTES } from "@/lib/constants";
import { PRIVATE_DINING } from "@/lib/constants/private-dining";
import { WEDDINGS } from "@/lib/constants/private-dining-weddings";
import { buildSeoMetadata, getSectionBreadcrumbSchema } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: WEDDINGS.title,
  description: WEDDINGS.seoDescription,
  url: ROUTES.WEDDINGS,
  image: WEDDINGS.hero.image.src,
  imageAlt: WEDDINGS.hero.image.alt,
});

export default function WeddingsPage() {
  return (
    <>
      <JsonLd
        data={getSectionBreadcrumbSchema(
          { name: PRIVATE_DINING.title, url: ROUTES.PRIVATE_DINING },
          { name: WEDDINGS.title, url: ROUTES.WEDDINGS },
        )}
      />
      <PrivateDiningWeddings />
    </>
  );
}
