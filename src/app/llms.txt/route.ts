import { HTTP_CONTENT_TYPE } from "@/lib/constants";
import { buildLlmsText, getSiteUrl } from "@/lib/seo";
import { getSeasonalEntries } from "@/services/seasonal";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const result = await getSeasonalEntries();
  const entries = result.isOk()
    ? result.value.filter((entry) => !entry.noIndex)
    : [];

  return new Response(buildLlmsText(getSiteUrl(), entries), {
    headers: {
      "Content-Type": `${HTTP_CONTENT_TYPE.MARKDOWN}; charset=utf-8`,
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
