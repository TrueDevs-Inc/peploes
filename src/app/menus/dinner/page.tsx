import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("dinner");
}

export default function MenuPage() {
  return <CmsMenuPage slug="dinner" />;
}
