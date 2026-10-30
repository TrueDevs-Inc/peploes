import { JsonLd } from "@/components/app/atoms/json-ld";
import { PrivateDiningCelebrations } from "@/components/app/compounds/private-dining-celebrations";
import { ROUTES } from "@/lib/constants";
import { PRIVATE_DINING } from "@/lib/constants/private-dining";
import { CELEBRATIONS } from "@/lib/constants/private-dining-celebrations";
import { buildSeoMetadata, getSectionBreadcrumbSchema } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: CELEBRATIONS.title,
  description: CELEBRATIONS.seoDescription,
  url: ROUTES.CELEBRATIONS,
  image: CELEBRATIONS.hero.image.src,
  imageAlt: CELEBRATIONS.hero.image.alt,
});

export default function CelebrationsPage() {
  return (
    <>
      <JsonLd
        data={getSectionBreadcrumbSchema(
          { name: PRIVATE_DINING.title, url: ROUTES.PRIVATE_DINING },
          { name: CELEBRATIONS.title, url: ROUTES.CELEBRATIONS },
        )}
      />
      <PrivateDiningCelebrations />
    </>
  );
}
