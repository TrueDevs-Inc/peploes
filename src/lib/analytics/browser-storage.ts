function cookieDomains(): string[] {
  const labels = window.location.hostname.split(".");
  // Host-only first, then the host and each parent that still has two labels.
  const domains = [""];
  for (let start = 0; start <= labels.length - 2; start++) {
    domains.push(labels.slice(start).join("."));
  }
  return domains;
}

export function clearCookies(pattern: RegExp): void {
  try {
    const names = document.cookie
      .split(";")
      .map((cookie) => cookie.split("=")[0]?.trim() ?? "")
      .filter((name) => pattern.test(name));
    for (const name of names) {
      for (const domain of cookieDomains()) {
        const scope = domain ? `; Domain=${domain}` : "";
        // biome-ignore lint/suspicious/noDocumentCookie: withdrawal must expire cookies synchronously, and cookieStore support for per-domain deletion is not universal.
        document.cookie = `${name}=; Max-Age=0; Path=/${scope}`;
      }
    }
  } catch {
    // Blocked cookies hold nothing to clear.
  }
}

export function clearStorageKeys(
  getStorage: () => Storage,
  pattern: RegExp,
): void {
  try {
    const storage = getStorage();
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key !== null && pattern.test(key)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Blocked storage holds nothing to clear.
  }
}
