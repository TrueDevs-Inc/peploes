import {
  CmsMenuPage,
  getMenuMetadata,
} from "@/components/app/compounds/cms-menu-page";
import { getSelectedMenu } from "@/lib/menu-selection";

export async function generateMetadata({ searchParams }: PageProps<"/menus">) {
  return getMenuMetadata(getSelectedMenu((await searchParams).menu));
}

export default async function MenusPage({ searchParams }: PageProps<"/menus">) {
  return <CmsMenuPage slug={getSelectedMenu((await searchParams).menu)} />;
}
