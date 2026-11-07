import { z } from "zod";
import { sha256 } from "./identity";
import { PerformanceError, type TManifest } from "./manifest";

const query =
  '*[_type in ["journalArticle","seasonalEntry"] && enabled != false]{...,"heroAsset":hero.image.asset->url,"journalHeroAsset":heroImage.asset->url,blocks[]{...,image{...,"src":asset->url}},story{...,image{...,"src":asset->url}},gallery{...,images[]{...,"src":asset->url}},invitation{...,image{...,"src":asset->url}},menu{...,cards[]{...,image{...,"src":asset->url}}}}';
const documentSchema = z.object({
  _id: z.string(),
  _rev: z.string(),
  _updatedAt: z.string(),
  _type: z.enum(["journalArticle", "seasonalEntry"]),
  slug: z.object({ current: z.string() }),
  noIndex: z.boolean().optional(),
});

export async function verifyContent(manifest: TManifest, signal: AbortSignal) {
  const { projectId, dataset, apiVersion } = manifest.cms;
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    redirect: "error",
  });
  if (!response.ok)
    throw new PerformanceError(
      `Published content readiness HTTP ${response.status}`,
    );
  const body: unknown = await response.json();
  const { result: documents } = z
    .object({ result: z.array(z.record(z.string(), z.unknown())) })
    .parse(body);
  const result = documents
    .map((document) => ({
      ...documentSchema.parse(document),
      hash: sha256(JSON.stringify(document)),
    }))
    .sort((a, b) => a._id.localeCompare(b._id));
  for (const route of manifest.routes) {
    if (!route.content) continue;
    const document = result.find(
      (candidate) => candidate._id === route.content?.id,
    );
    if (
      !document ||
      (document.noIndex ?? true) !== route.content.noIndex ||
      `/${document._type === "journalArticle" ? "journal" : "seasonal"}/${document.slug.current}` !==
        route.path ||
      document._rev !== route.content.revision ||
      document._updatedAt !== route.content.updatedAt ||
      document.hash !== route.content.hash
    ) {
      throw new PerformanceError(
        `Published detail identity changed or unavailable: ${route.path}`,
      );
    }
  }
  return result.map((document) => ({
    id: document._id,
    revision: document._rev,
    hash: document.hash,
  }));
}
