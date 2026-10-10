import { PrivateDiningCelebrations } from "@/components/app/compounds/private-dining-celebrations";
import { ROUTES } from "@/lib/constants";
import { CELEBRATIONS } from "@/lib/constants/private-dining-celebrations";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: CELEBRATIONS.title,
  description: CELEBRATIONS.seoDescription,
  url: ROUTES.CELEBRATIONS,
  image: CELEBRATIONS.hero.image.src,
  imageAlt: CELEBRATIONS.hero.image.alt,
});

export default function CelebrationsPage() {
  return <PrivateDiningCelebrations />;
}
