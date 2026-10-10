import { VisitContact } from "@/components/app/compounds/visit-contact";
import { ROUTES } from "@/lib/constants";
import { VISIT_CONTACT_CONTENT } from "@/lib/constants/visit-contact";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: VISIT_CONTACT_CONTENT.title,
  description: VISIT_CONTACT_CONTENT.seoDescription,
  url: ROUTES.VISIT_CONTACT,
  image: VISIT_CONTACT_CONTENT.hero.image.src,
  imageAlt: VISIT_CONTACT_CONTENT.hero.image.alt,
});

export default function VisitContactPage() {
  return <VisitContact />;
}
