import { MenuBooking } from "@/components/app/compounds/menu-booking";
import { MenuEditorialIntro } from "@/components/app/molecules/menu-editorial-intro";
import { MenuNotes } from "@/components/app/molecules/menu-notes";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { formatMenuPrice } from "@/lib/menu-price";
import type { IDrinksMenuProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DrinksMenu({ menu }: IDrinksMenuProps) {
  return (
    <article
      className={cn(
        dmSans.className,
        "bg-warm-cream text-ink xl:text-[#282828]",
      )}
    >
      <div className="site-container pb-12">
        <MenuEditorialIntro menu={menu} />
        {menu.cocktailSections
          .filter((section) => section.dishes.length > 0)
          .map((section) => (
            <section
              key={section._key}
              aria-labelledby={section._key}
              className="section-divider-subtle py-8 xl:py-10"
            >
              <h2
                data-scroll-reveal
                id={section._key}
                className={cn(
                  ebGaramond.className,
                  "mb-6 text-[38px] leading-[42px] tracking-[-0.4px] before:mb-2 before:block before:h-0.5 before:w-[42px] before:bg-peploe-burgundy xl:mb-5 xl:text-[32px] xl:leading-[38px] xl:before:hidden",
                )}
              >
                {section.heading}
              </h2>
              <ul className="space-y-4 xl:space-y-[14px]">
                {section.dishes.map((dish) => (
                  <li
                    data-scroll-reveal
                    key={dish._key}
                    className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 xl:grid-cols-[160px_1fr_auto]"
                  >
                    <h3 className="text-base leading-6">{dish.name}</h3>
                    {dish.description && (
                      <p
                        className={cn(
                          ebGaramond.className,
                          "col-start-1 row-start-2 text-[15px] leading-[23px] text-text-secondary xl:col-start-2 xl:row-start-1 xl:text-sm xl:text-[#505050]",
                        )}
                      >
                        {dish.description}
                      </p>
                    )}
                    {dish.price != null && (
                      <span className="col-start-2 row-start-1 text-sm leading-6 xl:col-start-3">
                        {formatMenuPrice(dish.price, dish.priceDecimalPlaces)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        {menu.spirits.some((section) => section.dishes.length > 0) && (
          <section
            aria-labelledby="spirits-heading"
            className="section-divider-subtle pt-8 xl:pt-10"
          >
            <h2
              data-scroll-reveal
              id="spirits-heading"
              className={cn(
                ebGaramond.className,
                "text-[38px] leading-[42px] tracking-[-0.4px] before:mb-2 before:block before:h-0.5 before:w-[42px] before:bg-peploe-burgundy xl:text-[32px] xl:leading-[38px] xl:before:hidden",
              )}
            >
              {menu.spiritsHeading}
            </h2>
            {menu.spiritsDescription && (
              <p
                data-scroll-reveal
                className="mt-4 text-[15px] leading-6 text-text-secondary xl:text-base xl:text-[#505050]"
              >
                {menu.spiritsDescription}
              </p>
            )}
            <div className="mt-5 grid border-t border-soft-stone pt-3 xl:mt-8 xl:grid-cols-2 xl:gap-x-28 xl:border-t-0 xl:pt-0">
              {menu.spirits
                .filter((section) => section.dishes.length > 0)
                .map((section) => (
                  <section
                    data-scroll-reveal
                    key={section._key}
                    aria-labelledby={section._key}
                    className={cn(
                      "border-soft-stone py-4 not-first:border-t xl:py-5 xl:even:-ml-14 xl:even:border-l xl:even:pl-14 xl:nth-2:border-t-0",
                      section.columns === 2 && "xl:col-span-2",
                    )}
                  >
                    <h3
                      id={section._key}
                      className="mb-4 flex items-center xl:mb-1 gap-2.5 text-sm tracking-[0.08em] text-peploe-burgundy uppercase xl:text-[#242424] before:h-0.5 before:w-12 before:bg-peploe-burgundy"
                    >
                      {section.heading}
                    </h3>
                    <div
                      className={cn(
                        "grid gap-4",
                        section.columns === 2 && "xl:grid-cols-2 xl:gap-x-28",
                      )}
                    >
                      {Array.from({ length: section.columns }, (_, index) =>
                        section.dishes.slice(
                          index *
                            Math.ceil(section.dishes.length / section.columns),
                          (index + 1) *
                            Math.ceil(section.dishes.length / section.columns),
                        ),
                      )
                        .filter((items) => items.length > 0)
                        .map((items) => (
                          <table
                            key={items[0]._key}
                            className="w-full text-[15px] xl:text-base"
                          >
                            <caption className="sr-only">
                              {section.heading} prices in euro
                            </caption>
                            <thead>
                              <tr className="text-[10px] font-medium tracking-[0.04em] text-peploe-burgundy uppercase xl:text-xs xl:text-[#242424]">
                                <th
                                  scope="col"
                                  className="pb-3 xl:pb-1.5 text-left font-medium"
                                >
                                  <span className="text-text-secondary xl:sr-only">
                                    Selection
                                  </span>
                                </th>
                                <th
                                  scope="col"
                                  className="pb-3 xl:pb-1.5 text-right font-medium"
                                >
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((dish) => (
                                <tr key={dish._key}>
                                  <th
                                    scope="row"
                                    className="py-1 pr-4 text-left leading-[21px] font-normal xl:leading-[22px]"
                                  >
                                    {dish.name}
                                    {dish.description && (
                                      <span className="mt-1 block text-sm text-text-secondary">
                                        {dish.description}
                                      </span>
                                    )}
                                  </th>
                                  <td className="py-1 text-right align-top whitespace-nowrap text-sm leading-[21px] xl:leading-[22px]">
                                    {formatMenuPrice(
                                      dish.price,
                                      dish.priceDecimalPlaces ?? 2,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ))}
                    </div>
                  </section>
                ))}
            </div>
          </section>
        )}
      </div>
      <MenuNotes menu={menu} compact />
      <MenuBooking booking={menu.booking} />
    </article>
  );
}
