import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES, WHATS_ON_CONTENT } from "@/lib/constants";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type {
  IEventActionProps,
  IEventCardProps,
  IWhatsOnProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function EventAction({ label, mobileLabel, href }: IEventActionProps) {
  const content = (
    <>
      {mobileLabel ? (
        <>
          <span className="sm:hidden">{mobileLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );

  return (
    <Button
      asChild={Boolean(href)}
      type={href ? undefined : "button"}
      variant="brand-text"
      aria-disabled={href ? undefined : true}
      className="h-11 w-fit justify-start gap-2 rounded-none px-0 has-[>svg]:px-0 text-base leading-6 font-medium text-warm-cream uppercase"
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </Button>
  );
}

function EventCard({ event, featured = false }: IEventCardProps) {
  return (
    <article
      className={cn(
        "min-w-0 max-sm:pb-6 max-sm:shadow-[inset_0_-1px_0_rgb(250_247_241/0.3)]",
        featured
          ? "flex flex-col gap-[14px] sm:gap-4"
          : "relative grid grid-cols-1 items-start gap-[14px] sm:not-first:pt-6 sm:not-first:before:absolute sm:not-first:before:inset-x-0 sm:not-first:before:top-0 sm:not-first:before:h-px sm:not-first:before:bg-warm-cream/30 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          featured
            ? "h-[236px] rounded-[2px] sm:aspect-635/172 sm:h-auto"
            : "h-[190px] rounded-[1px] sm:aspect-5/4 sm:h-40",
        )}
      >
        <Image
          src={event.image.src}
          alt={event.image.alt}
          fill
          sizes={
            featured
              ? "(min-width: 1280px) calc((100vw - 192px) * 635 / 1248), calc(100vw - 48px)"
              : "(min-width: 640px) 200px, calc(100vw - 48px)"
          }
          className={cn("object-cover", featured && "sm:object-[center_60%]")}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-xs leading-4 font-medium tracking-[0.1em] uppercase">
          {event.category}
        </p>
        <h3
          className={cn(
            ebGaramond.className,
            featured
              ? "text-[34px] leading-9 font-normal sm:text-[42px] sm:leading-[48px]"
              : "text-[28px] leading-[29px] font-normal sm:text-2xl sm:leading-[30px] sm:font-medium",
          )}
        >
          {event.title}
        </h3>
        <p
          className={cn(
            "text-soft-stone",
            featured
              ? "text-sm leading-[21px] sm:text-base sm:leading-6"
              : "text-sm leading-[21px]",
          )}
        >
          {event.description}
        </p>
        <EventAction
          label={event.ctaLabel}
          mobileLabel={event.mobileCtaLabel}
        />
      </div>
    </article>
  );
}

export function WhatsOn({ events }: IWhatsOnProps) {
  const [featuredEvent, ...otherEvents] = events;

  if (!featuredEvent) return null;

  return (
    <section
      id="whats-on"
      aria-labelledby="whats-on-heading"
      className={cn(
        dmSans.className,
        "bg-button-primary-pressed text-warm-cream",
      )}
    >
      <div className="site-container flex flex-col gap-8 pt-12 pb-[52px] sm:gap-12 sm:py-20">
        <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:gap-7">
              <p className="flex items-center gap-2 text-xs leading-4 font-medium tracking-[0.1em] uppercase">
                <span
                  aria-hidden="true"
                  className="h-px w-12 bg-current sm:w-6"
                />
                {WHATS_ON_CONTENT.eyebrow}
              </p>
              <h2
                id="whats-on-heading"
                className={cn(
                  ebGaramond.className,
                  "text-[42px] leading-[42px] font-medium sm:text-[60px] sm:leading-[66px]",
                )}
              >
                {WHATS_ON_CONTENT.heading}
              </h2>
            </div>
            <p className="text-base leading-6 sm:text-lg">
              {WHATS_ON_CONTENT.description}
            </p>
          </div>
          <EventAction
            label={WHATS_ON_CONTENT.ctaLabel}
            href={ROUTES.WHATS_ON}
          />
        </div>

        <div className="grid items-start gap-6 sm:gap-12 xl:grid-cols-[minmax(0,635fr)_minmax(0,613fr)]">
          <EventCard event={featuredEvent} featured />
          {otherEvents.length > 0 && (
            <div className="flex min-w-0 flex-col gap-6">
              {otherEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
