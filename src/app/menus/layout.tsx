import type { ReactNode } from "react";

import { MenuHero } from "@/components/app/compounds/menu-hero";
import { MenuNavigation } from "@/components/app/molecules/menu-navigation";
import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { ebGaramond } from "@/lib/fonts";

export default function MenusLayout({ children }: { children: ReactNode }) {
  return (
    <main className="[font-optical-sizing:none] [font-variation-settings:'opsz'_14]">
      <MenuHero />
      <MenuNavigation
        items={MENU_PAGE_CONTENT.navigation}
        label={MENU_PAGE_CONTENT.navigationLabel}
        className={ebGaramond.className}
      />
      {children}
    </main>
  );
}
