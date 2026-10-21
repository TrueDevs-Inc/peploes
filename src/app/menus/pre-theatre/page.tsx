import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("pre-theatre");
}

export default function MenuPage() {
  return <CmsMenuPage slug="pre-theatre" />;
}
