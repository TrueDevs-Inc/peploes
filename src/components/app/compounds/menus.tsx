import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MOBILE_HOME_CONTENT, ROUTES } from "@/lib/constants";
import { MENUS_CONTENT } from "@/lib/constants/menus";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function Menus() {
  return (
    <section
      aria-labelledby="menus-heading"
      className={cn(dmSans.className, "bg-warm-cream text-ink")}
    >
      <div className="relative h-[238px] sm:h-[300px] lg:h-[370px]">
        <Image
          src={MENUS_CONTENT.image.src}
          alt={MENUS_CONTENT.image.alt}
          fill
          sizes="100vw"
          className="hidden object-cover sm:block"
        />
        <Image
          src={MOBILE_HOME_CONTENT.menusImage}
          alt={MENUS_CONTENT.image.alt}
          fill
          sizes="100vw"
          className="object-cover sm:hidden"
        />
      </div>

      <div className="site-container flex flex-col gap-5 pt-10 pb-12 sm:gap-7 sm:pt-12 sm:pb-20">
        <p className="flex items-center gap-2.5 text-xs leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase sm:text-sm">
          <span
            aria-hidden="true"
            className="h-0.5 w-10 shrink-0 bg-current sm:w-12"
          />
          {MENUS_CONTENT.eyebrow}
        </p>

        <div className="flex flex-col gap-3 sm:gap-4">
          <h2
            id="menus-heading"
            className={cn(
              ebGaramond.className,
              "text-[38px] leading-10 font-medium tracking-[-0.4px] text-balance text-peploe-burgundy max-[360px]:text-[34px] max-[360px]:leading-[38px] sm:text-[52px] sm:text-wrap sm:leading-[56px] sm:tracking-normal lg:text-[60px] lg:leading-[48px]",
            )}
          >
            {MENUS_CONTENT.heading}
          </h2>
          <p className="text-base leading-6 text-pretty text-text-secondary sm:text-lg sm:text-wrap">
            {MENUS_CONTENT.description}
          </p>
        </div>

        <ul
          aria-label={MENUS_CONTENT.categoriesLabel}
          className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 md:grid-cols-3 xl:grid-cols-6 xl:gap-x-[72px]"
        >
          {MENUS_CONTENT.categories.map(({ label, href }) => {
            const content = (
              <>
                <span className="flex items-center justify-between gap-2">
                  {label}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-peploe-burgundy sm:text-current"
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="hidden w-full border-t border-peploe-burgundy/60 group-hover:border-peploe-burgundy sm:block"
                />
              </>
            );
            return (
              <li key={label} className="min-w-0">
                <Button
                  asChild={Boolean(href)}
                  type={href ? undefined : "button"}
                  variant="brand-nav"
                  aria-disabled={href ? undefined : true}
                  className={cn(
                    ebGaramond.className,
                    "group h-[51px] w-full flex-col items-stretch justify-center gap-1.5 rounded-none border-b border-soft-stone p-0 text-xl leading-[26px] font-medium hover:no-underline sm:h-[72px] sm:justify-start sm:border-0 sm:pt-4",
                  )}
                >
                  {href ? <Link href={href}>{content}</Link> : content}
                </Button>
              </li>
            );
          })}
        </ul>

        <Button
          asChild
          variant="brand-primary"
          className="h-11 w-full self-start rounded-[4px] bg-peploe-burgundy px-5 has-[>svg]:px-5 text-base leading-6 font-medium text-warm-cream shadow-none sm:w-[204px]"
        >
          <Link href={ROUTES.MENUS}>
            {MENUS_CONTENT.ctaLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
