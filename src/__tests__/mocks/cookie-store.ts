import type { IHoldCookieOptions, IHoldCookieStore } from "@/lib/types";

interface IStoredCookie {
  value: string;
  options: IHoldCookieOptions;
}

export function fakeCookieStore() {
  const cookies = new Map<string, IStoredCookie>();
  const store: IHoldCookieStore = {
    get: function get(name: string) {
      const cookie = cookies.get(name);
      return cookie ? { name, value: cookie.value } : undefined;
    },
    set: function set(
      name: string,
      value: string,
      options: IHoldCookieOptions,
    ) {
      cookies.set(name, { value, options });
      return store;
    },
    delete: function remove({ name, path }: { name: string; path: string }) {
      if (cookies.get(name)?.options.path === path) {
        cookies.delete(name);
      }
      return store;
    },
  };
  return { store, cookies };
}
