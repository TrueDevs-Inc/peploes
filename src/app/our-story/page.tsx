import { OurStory } from "@/components/app/compounds/our-story";
import { ROUTES } from "@/lib/constants";
import { OUR_STORY_CONTENT } from "@/lib/constants/our-story";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: OUR_STORY_CONTENT.title,
  description: OUR_STORY_CONTENT.seoDescription,
  url: ROUTES.OUR_STORY,
  image: OUR_STORY_CONTENT.hero.image.src,
  imageAlt: OUR_STORY_CONTENT.hero.image.alt,
});

export default function OurStoryPage() {
  return <OurStory />;
}
