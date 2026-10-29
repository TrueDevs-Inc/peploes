import { Mail, Phone } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { HUMAN_HOSPITALITY_CONTENT } from "@/lib/constants/human-hospitality";
import { dmSans, ebGaramond } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function HumanHospitality() {
  return (
    <section
      aria-labelledby="human-hospitality-heading"
      className={cn(
        dmSans.className,
        "section-divider overflow-hidden bg-warm-cream bg-linear-to-b from-ink/10 to-transparent to-[66px] text-ink",
      )}
    >
      <div className="relative isolate grid xl:ml-[max(0px,calc((100vw-var(--site-content-max-width))/2-72px))] xl:max-w-[calc(var(--site-content-max-width)+72px)] xl:grid-cols-[minmax(0,1fr)_min(37.5%,563px)] xl:gap-8">
        <div className="site-container relative z-10 xl:mx-0 xl:ml-[72px] xl:w-auto">
          <div className="flex min-w-0 flex-col items-start gap-5 pt-12 pb-9 sm:gap-7 sm:py-20 xl:max-w-[783px]">
            <p
              data-scroll-reveal
              className="flex items-center gap-2.5 text-sm leading-4 font-medium tracking-[0.1em] text-peploe-burgundy uppercase"
            >
              <span
                aria-hidden="true"
                className="h-0.5 w-12 shrink-0 bg-current"
              />
              {HUMAN_HOSPITALITY_CONTENT.eyebrow}
            </p>

            <div data-scroll-reveal className="flex flex-col gap-5 sm:gap-4">
              <h2
                id="human-hospitality-heading"
                className={cn(
                  ebGaramond.className,
                  "text-[42px] leading-[42px] font-medium text-peploe-burgundy sm:text-[52px] sm:leading-[58px] xl:text-[60px] xl:leading-[66px]",
                )}
              >
                {HUMAN_HOSPITALITY_CONTENT.heading}
              </h2>
              <p className="text-base leading-[25px] text-ink/82 sm:leading-[26px] sm:text-ink/80">
                {HUMAN_HOSPITALITY_CONTENT.description}
              </p>
            </div>

            <div
              data-scroll-reveal
              className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
            >
              <Button
                asChild
                variant="brand-contact"
                size="cta"
                className="max-sm:w-full"
              >
                <a href={HUMAN_HOSPITALITY_CONTENT.phoneAction.href}>
                  <Phone
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.5}
                  />
                  {HUMAN_HOSPITALITY_CONTENT.phoneAction.label}
                </a>
              </Button>
              <Button
                asChild
                variant="brand-contact"
                size="cta"
                className="max-sm:w-full"
              >
                <a href={HUMAN_HOSPITALITY_CONTENT.emailAction.href}>
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.5}
                  />
                  {HUMAN_HOSPITALITY_CONTENT.emailAction.label}
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative h-[222px] w-full max-w-[675px] self-end justify-self-end overflow-hidden sm:aspect-[563/389] sm:h-auto xl:max-w-[563px]">
          <Image
            src={HUMAN_HOSPITALITY_CONTENT.image.src}
            alt={HUMAN_HOSPITALITY_CONTENT.image.alt}
            width={1024}
            height={1024}
            sizes="(min-width: 1502px) 704px, (min-width: 1280px) 46.875vw, (min-width: 675px) 844px, (min-width: 640px) 125vw, 138.5vw"
            className="absolute -top-[29.7%] -left-[30.3%] h-[181.5%] w-[138.5%] max-w-none sm:-top-[30.4%] sm:-left-[17%] sm:h-auto sm:w-[125%]"
          />
        </div>
      </div>
    </section>
  );
}
