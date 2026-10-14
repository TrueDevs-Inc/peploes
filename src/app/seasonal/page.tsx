import { Seasonal } from "@/components/app/compounds/seasonal";
import { ROUTES } from "@/lib/constants";
import { SEASONAL_CONTENT } from "@/lib/constants/seasonal";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: SEASONAL_CONTENT.title,
  description: SEASONAL_CONTENT.seoDescription,
  url: ROUTES.WHATS_ON,
  image: SEASONAL_CONTENT.hero.image.src,
  imageAlt: SEASONAL_CONTENT.hero.image.alt,
});

export default function SeasonalPage() {
  return <Seasonal />;
}
