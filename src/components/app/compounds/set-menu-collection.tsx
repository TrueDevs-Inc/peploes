import { ArrowRight } from "lucide-react";

import { MenuBooking } from "@/components/app/compounds/menu-booking";
import { MenuCourse } from "@/components/app/molecules/menu-course";
import { MenuEditorialIntro } from "@/components/app/molecules/menu-editorial-intro";
import { MenuNotes } from "@/components/app/molecules/menu-notes";
import { FOCUS_RING } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { formatMenuPrice } from "@/lib/menu-price";
import type { ISetMenuCollectionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetMenuCollection({ menu }: ISetMenuCollectionProps) {
  return (
    <article className={cn(dmSans.className, "bg-warm-cream text-ink")}>
      <div className="site-container pb-8">
        <MenuEditorialIntro menu={menu} compact />
        <nav
          data-scroll-reveal
          aria-label={`${menu.title} sections`}
          className="mb-10 grid gap-3 xl:mb-8 xl:grid-cols-2 xl:gap-6"
        >
          {menu.menus.map((set) => (
            <a
              key={set._key}
              href={`#${set._key}`}
              className={cn(
                FOCUS_RING,
                "flex items-center justify-between gap-5 border border-soft-stone bg-[#fcfaf6] px-4 py-4 hover:border-peploe-burgundy focus-visible:ring-peploe-burgundy xl:px-6",
              )}
            >
              <div>
                <h2
                  className={cn(
                    ebGaramond.className,
                    "text-[25px] leading-8 xl:text-[26px]",
                  )}
                >
                  {set.title}
                </h2>
                <p className="mt-1 text-[13px] leading-[18px] text-text-secondary xl:text-sm">
                  {formatMenuPrice(set.price)} per person
                  <span aria-hidden="true" className="px-2">
                    |
                  </span>
                  {set.serviceTimes ?? set.cardDescription ?? set.summary}
                </p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-peploe-burgundy">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </a>
          ))}
        </nav>
        {menu.menus.map((set) => (
          <section
            key={set._key}
            id={set._key}
            aria-labelledby={`${set._key}-title`}
            className="scroll-mt-40 not-last:mb-6"
          >
            <header
              data-scroll-reveal
              className="border-b border-soft-stone bg-[#f1e9e3] px-4 py-6 text-center xl:py-4"
            >
              <h2
                id={`${set._key}-title`}
                className={cn(
                  ebGaramond.className,
                  "text-[38px] leading-[44px] xl:text-[42px] xl:leading-[50px]",
                )}
              >
                {set.title}
              </h2>
              <p className="mt-2 text-base">
                {formatMenuPrice(set.price)} per person
              </p>
              <p className="mt-3 text-sm leading-5 text-text-secondary">
                {set.summary}
              </p>
              {set.inclusions.length > 0 && (
                <div className="mx-auto mt-2 hidden max-w-[800px] items-center justify-center gap-2.5 border-t border-soft-stone pt-2 text-sm leading-[18px] text-text-secondary xl:flex">
                  {menu.inclusionsHeading && (
                    <p className="text-peploe-burgundy uppercase xl:border-r xl:border-soft-stone xl:pr-2.5">
                      {menu.inclusionsHeading}
                    </p>
                  )}
                  <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                    {set.inclusions.map((note, index) => (
                      <li key={note} className="flex items-center gap-5">
                        {index > 0 && (
                          <span aria-hidden="true" className="hidden xl:inline">
                            •
                          </span>
                        )}
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </header>
            {set.courses.map((course) => (
              <MenuCourse
                key={course._key}
                course={course}
                idPrefix={set._key}
                compact
              />
            ))}
          </section>
        ))}
      </div>
      <MenuNotes menu={menu} collection />
      <MenuBooking booking={menu.booking} />
    </article>
  );
}
