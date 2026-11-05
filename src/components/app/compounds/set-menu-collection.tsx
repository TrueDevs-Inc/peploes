import { MenuBooking } from "@/components/app/compounds/menu-booking";
import { SetMenuSelection } from "@/components/app/compounds/set-menu-selection";
import { MenuEditorialIntro } from "@/components/app/molecules/menu-editorial-intro";
import { MenuNotes } from "@/components/app/molecules/menu-notes";
import { dmSans } from "@/lib/fonts";
import type { ISetMenuCollectionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetMenuCollection({ menu }: ISetMenuCollectionProps) {
  return (
    <article
      id={`${menu.slug}-introduction`}
      className={cn(dmSans.className, "scroll-mt-40 bg-warm-cream text-ink")}
    >
      <SetMenuSelection menu={menu}>
        <MenuEditorialIntro menu={menu} compact />
      </SetMenuSelection>
      <MenuNotes menu={menu} collection />
      <MenuBooking booking={menu.booking} />
    </article>
  );
}
