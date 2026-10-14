import { notFound } from "next/navigation";

import { PolicyPage } from "@/components/app/compounds/policy-page";
import { POLICY_PAGES } from "@/lib/constants/policies";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(POLICY_PAGES).map((policy) => ({
    slug: policy.path.slice(1),
  }));
}

function getPolicy(slug: string) {
  const policy = Object.values(POLICY_PAGES).find(
    (candidate) => candidate.path === `/${slug}`,
  );

  if (!policy) notFound();

  return policy;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const policy = getPolicy(slug);

  return buildSeoMetadata({
    title: policy.title,
    description: policy.seoDescription,
    url: policy.path,
    image: policy.image.src,
    imageAlt: policy.image.alt,
  });
}

export default async function PolicySlugPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;

  return <PolicyPage policy={getPolicy(slug)} />;
}
