import type { MetadataRoute } from "next";
import { isLiveSite } from "@/lib/config";
import { buildRobots, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getSiteUrl(), isLiveSite());
}
