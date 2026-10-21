import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("wine");
}

export default function MenuPage() {
  return <CmsMenuPage slug="wine" />;
}
