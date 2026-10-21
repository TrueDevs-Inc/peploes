import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("group-set-menu");
}

export default function MenuPage() {
  return <CmsMenuPage slug="group-set-menu" />;
}
