const QUERY_KEYS = new Set([
  "http.query",
  "http.fragment",
  "url.query",
  "url.fragment",
]);
const URL_KEYS = new Set(["url", "url.full", "http.url"]);

function withoutQuery(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? value;
}

function scrubData(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (QUERY_KEYS.has(key)) {
      data[key] = undefined;
    } else if (URL_KEYS.has(key) && typeof value === "string") {
      data[key] = withoutQuery(value);
    }
  }
}

export function scrubBreadcrumb<T extends { data?: Record<string, unknown> }>(
  breadcrumb: T,
): T {
  if (breadcrumb.data) {
    scrubData(breadcrumb.data);
  }
  return breadcrumb;
}

export function scrubSpan<
  T extends { description?: string; data: Record<string, unknown> },
>(span: T): T {
  scrubData(span.data);
  const named: { description?: string } = span;
  if (named.description) {
    named.description = withoutQuery(named.description);
  }
  return span;
}
