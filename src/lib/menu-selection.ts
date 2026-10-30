import { MENU_SLUGS } from "@/lib/constants";

export function getSelectedMenu(value: string | string[] | null | undefined) {
  return MENU_SLUGS.find((slug) => slug === value) ?? "lunch";
}
