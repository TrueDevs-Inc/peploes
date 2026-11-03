import { MENU_SLUGS } from "@/lib/constants";

export function getSelectedMenu(value: string | string[] | null | undefined) {
  return MENU_SLUGS.find((slug) => slug === value) ?? "lunch";
}

export function selectMenuSection(hash: string) {
  const oldURL = window.location.href;
  const destination = new URL(oldURL);
  destination.hash = hash;
  if (destination.href === oldURL) return;
  window.history.pushState(null, "", destination);
  window.dispatchEvent(
    new HashChangeEvent("hashchange", { oldURL, newURL: destination.href }),
  );
}
