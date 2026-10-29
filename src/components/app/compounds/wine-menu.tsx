import { ChevronDown, Minus, Plus } from "lucide-react";

import { WineIndexCloseButton } from "@/components/app/atoms/wine-index-close-button";
import { MenuBooking } from "@/components/app/compounds/menu-booking";
import { MenuEditorialIntro } from "@/components/app/molecules/menu-editorial-intro";
import { MenuNotes } from "@/components/app/molecules/menu-notes";
import { WineCategory } from "@/components/app/molecules/wine-category";
import { FOCUS_RING } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type {
  IWineMenuProps,
  IWineSection,
  IWineSectionStyle,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getAvailableWineSections, getWineCategories } from "@/lib/wine-menu";

export function WineMenu({ menu }: IWineMenuProps) {
  const sections = getAvailableWineSections(menu.sections);
  return (
    <article className={cn(dmSans.className, "bg-warm-cream text-ink")}>
      <div className="site-container">
        <MenuEditorialIntro menu={menu} />
        {sections.length > 0 && (
          <details
            open
            className="group mb-8 border border-soft-stone bg-[#f1e9e3] px-[17px] py-[5px] xl:relative xl:-translate-x-[9px] xl:mb-8 xl:border-0 xl:bg-transparent xl:p-0"
          >
            <summary
              className={cn(
                FOCUS_RING,
                "flex min-h-10 w-full justify-between xl:w-fit xl:justify-start xl:min-h-12 cursor-pointer list-none items-center gap-6 text-xs tracking-[0.1em] text-peploe-burgundy uppercase focus-visible:ring-peploe-burgundy [&::-webkit-details-marker]:hidden xl:bg-peploe-burgundy xl:rounded-t-[4px] xl:px-6 xl:gap-2 xl:text-lg xl:tracking-normal xl:text-warm-cream xl:normal-case",
              )}
            >
              {menu.indexLabel}
              <Minus
                aria-hidden="true"
                className="hidden size-4 shrink-0 text-ink group-open:block xl:group-open:hidden"
              />
              <Plus
                aria-hidden="true"
                className="size-4 shrink-0 text-ink group-open:hidden xl:hidden"
              />
              <ChevronDown
                aria-hidden="true"
                className="hidden size-4 group-open:rotate-180 xl:block"
              />
            </summary>
            <WineIndexCloseButton />
            <nav
              aria-label={menu.indexLabel}
              className="grid xl:grid-cols-5 xl:border xl:border-soft-stone xl:bg-[#f1e9e3] xl:py-[15px]"
            >
              {sections.map((section) => (
                <div
                  key={section._key}
                  className="relative border-t border-soft-stone py-[11px] xl:flex xl:flex-col xl:border-t-0 xl:px-7 xl:py-0 xl:last:[&_ul]:before:hidden"
                >
                  <a
                    href={`#wine-${section._key}`}
                    className={cn(
                      FOCUS_RING,
                      "block pr-7 text-sm leading-5 font-medium text-ink focus-visible:ring-peploe-burgundy xl:pr-0 xl:font-normal xl:text-peploe-burgundy xl:text-[13px] xl:tracking-[0.16em] xl:uppercase",
                    )}
                  >
                    {section.heading}
                    <ChevronDown
                      aria-hidden="true"
                      className="absolute top-1/2 right-0 size-4 -translate-y-1/2 xl:hidden"
                    />
                  </a>
                  <ul
                    className={cn(
                      ebGaramond.className,
                      "pr-7 text-sm leading-[19px] text-text-secondary xl:pr-0 xl:text-ink xl:relative xl:mt-3 xl:flex-1 xl:space-y-[11px] xl:text-[18.5px] xl:leading-6 xl:before:absolute xl:before:-top-4 xl:before:-right-7 xl:before:bottom-[3px] xl:before:w-px xl:before:bg-soft-stone",
                    )}
                  >
                    {getWineCategories(section).map((category) => (
                      <li
                        key={category._key}
                        className="inline xl:block not-first:before:content-['_·_'] xl:before:hidden"
                      >
                        <a
                          href={`#${section._key}-${category._key}`}
                          className={cn(
                            FOCUS_RING,
                            "text-sm leading-[19px] hover:text-peploe-burgundy focus-visible:ring-peploe-burgundy xl:text-[18.5px]",
                          )}
                        >
                          <span className="xl:hidden">
                            {category.shortHeading ?? category.heading}
                          </span>
                          <span className="hidden xl:inline">
                            {category.heading}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </details>
        )}
      </div>
      {sections.map((section) => (
        <section
          key={section._key}
          id={`wine-${section._key}`}
          aria-labelledby={`wine-${section._key}-heading`}
          className={cn("scroll-mt-40", section.highlighted && "bg-[#f1e9e3]")}
        >
          <div className="site-container">
            <div
              style={getWineSectionStyle(section)}
              className="section-divider-subtle pt-8 pb-(--wine-mobile-bottom-padding) xl:pt-9 xl:pb-(--wine-bottom-padding)"
            >
              <h2
                data-scroll-reveal
                id={`wine-${section._key}-heading`}
                className={cn(
                  "mb-6 flex items-center xl:mb-1 gap-2.5 text-sm tracking-[0.08em] text-peploe-burgundy uppercase before:h-0.5 before:w-12 before:bg-peploe-burgundy",
                  section.description && "mb-3",
                )}
              >
                {section.heading}
              </h2>
              {section.description && (
                <p
                  data-scroll-reveal
                  className="mb-2.5 text-base leading-6 text-text-secondary xl:mb-10 xl:text-lg"
                >
                  {section.description}
                </p>
              )}
              <div className="grid xl:grid-cols-2 xl:gap-x-28">
                {getWineCategories(section).map((category) => {
                  const columnIndex = section.columns.findIndex((column) =>
                    column.categories.some(
                      (item) => item._key === category._key,
                    ),
                  );
                  const categories = section.columns[columnIndex].categories;
                  return (
                    <WineCategory
                      key={category._key}
                      category={category}
                      sectionKey={section._key}
                      column={columnIndex + 1}
                      continued={categories[0]._key !== category._key}
                      rowSpan={
                        categories.length === 1
                          ? Math.max(
                              ...section.columns.map(
                                (column) => column.categories.length,
                              ),
                            )
                          : 1
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}
      <MenuNotes
        menu={menu}
        compact
        allergenHeadingClassName="text-[21px] xl:text-base"
      />
      <MenuBooking booking={menu.booking} />
    </article>
  );
}

function getWineSectionStyle(section: IWineSection): IWineSectionStyle {
  return {
    "--wine-bottom-padding": `${section.desktopBottomPadding ?? 20}px`,
    "--wine-mobile-bottom-padding": `${section.mobileBottomPadding ?? 16}px`,
  };
}
