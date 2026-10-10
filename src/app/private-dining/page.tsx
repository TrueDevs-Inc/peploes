import { PrivateDining } from "@/components/app/compounds/private-dining";
import { ROUTES } from "@/lib/constants";
import { PRIVATE_DINING } from "@/lib/constants/private-dining";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: PRIVATE_DINING.title,
  description: PRIVATE_DINING.seoDescription,
  url: ROUTES.PRIVATE_DINING,
  image: PRIVATE_DINING.hero.image.src,
  imageAlt: PRIVATE_DINING.hero.image.alt,
});

export default function PrivateDiningPage() {
  return <PrivateDining />;
}
