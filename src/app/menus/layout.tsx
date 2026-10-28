import { Suspense } from "react";
import { MenuHero } from "@/components/app/compounds/menu-hero";
import { MenuNavigation } from "@/components/app/molecules/menu-navigation";
import { ebGaramond } from "@/lib/fonts";
import { loadMenuNavigation, loadMenusPage } from "@/lib/menu-content";
import type { IMenuLayoutProps } from "@/lib/types";

export default function MenusLayout({ children }: IMenuLayoutProps) {
  return (
    <main className="[font-optical-sizing:none] [font-variation-settings:'opsz'_14]">
      <Suspense
        fallback={
          <>
            <div
              className="min-h-[492px] bg-ink xl:min-h-[446px]"
              aria-busy="true"
            />
            <div className="min-h-96 bg-warm-cream" aria-busy="true" />
          </>
        }
      >
        {/* Hydrate the tabs and displayed menu together before a selection updates them. */}
        <MenuShell />
        {children}
      </Suspense>
    </main>
  );
}

async function MenuShell() {
  const [content, navigation] = await Promise.all([
    loadMenusPage(),
    loadMenuNavigation(),
  ]);
  return (
    <>
      <MenuHero content={content} />
      <MenuNavigation
        items={navigation}
        label={content.navigationLabel}
        className={ebGaramond.className}
      />
    </>
  );
}
