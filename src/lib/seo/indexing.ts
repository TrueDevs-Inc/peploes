const PLATFORM_HOST_SUFFIXES = [".netlify.app", ".vercel.app"] as const;
const INDEXABLE_PLATFORM_HOSTS_UNTIL_DOMAIN_LAUNCH = [
  "peploes.netlify.app",
] as const;

export function isSearchIndexableSite(siteUrl: string | undefined): boolean {
  if (!siteUrl || !URL.canParse(siteUrl)) return true;

  const { hostname } = new URL(siteUrl);
  if (
    INDEXABLE_PLATFORM_HOSTS_UNTIL_DOMAIN_LAUNCH.some(
      (host) => hostname === host,
    )
  )
    return true;

  return !PLATFORM_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}
