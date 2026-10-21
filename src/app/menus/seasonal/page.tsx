import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("seasonal");
}

export default function MenuPage() {
  return <CmsMenuPage slug="seasonal" />;
}
