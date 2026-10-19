import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";

export function generateMetadata() {
  return getMenuMetadata("lunch");
}

export default function MenuPage() {
  return <CmsMenuPage slug="lunch" />;
}
