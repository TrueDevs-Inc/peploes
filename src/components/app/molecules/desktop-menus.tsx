import { NavigationShelf } from "@/components/app/molecules/navigation-shelf";
import { NavigationShelfLink } from "@/components/app/molecules/navigation-shelf-link";
import { MENUS_SHELF_CONTENT } from "@/lib/constants";
import { MENUS_CONTENT, MENUS_SHELF_COLUMNS } from "@/lib/constants/menus";

export function DesktopMenus() {
  return (
    <NavigationShelf
      eyebrow={MENUS_CONTENT.eyebrow}
      heading={MENUS_SHELF_CONTENT.heading}
      introClassName="w-[360px]"
    >
      <ul
        aria-label={MENUS_CONTENT.categoriesLabel}
        className="grid h-[146px] min-w-0 flex-1 grid-cols-3 gap-10"
      >
        {MENUS_SHELF_COLUMNS.map((column) => (
          <li
            key={column[0].label}
            className="grid min-w-0 grid-rows-2 gap-6 not-last:shadow-[inset_-1px_0_0_var(--soft-stone)]"
          >
            {column.map(({ label, href }) => (
              <NavigationShelfLink
                key={label}
                label={label}
                href={href}
                className="min-h-0"
              />
            ))}
          </li>
        ))}
      </ul>
    </NavigationShelf>
  );
}
