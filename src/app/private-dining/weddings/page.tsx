import { PrivateDiningWeddings } from "@/components/app/compounds/private-dining-weddings";
import { ROUTES } from "@/lib/constants";
import { WEDDINGS } from "@/lib/constants/private-dining-weddings";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: WEDDINGS.title,
  description: WEDDINGS.seoDescription,
  url: ROUTES.WEDDINGS,
  image: WEDDINGS.hero.image.src,
  imageAlt: WEDDINGS.hero.image.alt,
});

export default function WeddingsPage() {
  return <PrivateDiningWeddings />;
}
