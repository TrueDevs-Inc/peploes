import Image from "next/image";

import { MENU_PAGE_CONTENT } from "@/lib/constants/menu-page";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function MenuHero() {
  return (
    <section
      className={cn(
        dmSans.className,
        "relative isolate flex min-h-[428px] items-end overflow-hidden bg-ink text-warm-cream xl:min-h-[390px] xl:items-center",
      )}
      aria-labelledby="menus-hero-heading"
    >
      <Image
        src={MENU_PAGE_CONTENT.image.src}
        alt={MENU_PAGE_CONTENT.image.alt}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-center xl:object-[50%_59.24%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(24,20,19,0)_0%,rgba(24,20,19,0.2)_28%,rgba(24,20,19,0.82)_100%)] xl:bg-[linear-gradient(90deg,rgba(24,20,19,0.98)_0%,rgba(24,20,19,0.8)_34.055%,rgba(24,20,19,0.18)_76.727%,rgba(24,20,19,0)_98.368%)]"
      />
      <div className="site-container py-[54px] xl:pt-[68px] xl:pb-[52px]">
        <p className="text-sm leading-5 font-medium tracking-[0.08em] uppercase">
          {MENU_PAGE_CONTENT.eyebrow}
        </p>
        <p
          id="menus-hero-heading"
          className={cn(
            ebGaramond.className,
            "whitespace-pre-line text-[46px] leading-[44px] tracking-[-0.6px] xl:mt-4 xl:text-[62px] xl:leading-[0.96] xl:tracking-[-1.5px]",
          )}
        >
          {MENU_PAGE_CONTENT.heading}
        </p>
        <span
          aria-hidden="true"
          className="mt-5 block xl:mt-4 h-px w-[58px] bg-peploe-burgundy"
        />
        <p className="mt-3 max-w-[430px] xl:mt-4 text-base leading-[23px] xl:text-lg xl:leading-[1.35]">
          {MENU_PAGE_CONTENT.description}
        </p>
      </div>
    </section>
  );
}
