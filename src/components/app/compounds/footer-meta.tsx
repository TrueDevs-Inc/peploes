import { Facebook, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";

export function FooterMeta() {
  return (
    <div
      data-footer-meta
      className="relative mt-20 flex flex-col gap-10 text-xs leading-[18px] text-text-secondary xl:mt-16 xl:flex-row xl:items-center xl:justify-between xl:gap-6 xl:pt-[25px] xl:leading-5 xl:before:absolute xl:before:inset-x-0 xl:before:top-0 xl:before:h-px xl:before:bg-soft-stone"
    >
      <div
        data-footer-legal
        className="order-2 flex flex-col gap-2 xl:order-1 xl:flex-row xl:items-center xl:gap-4"
      >
        <p className="order-2 xl:order-none">{FOOTER_CONTENT.copyright}</p>
        <span aria-hidden="true" className="hidden xl:inline">
          |
        </span>
        <nav aria-label={FOOTER_CONTENT.legalNavigationLabel}>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 xl:gap-x-4">
            {FOOTER_CONTENT.legalLabels.map(({ label, shortLabel }, index) => (
              <li key={label} className="flex items-center gap-3 xl:gap-4">
                {index > 0 && (
                  <span aria-hidden="true">
                    <span className="xl:hidden">·</span>
                    <span className="hidden xl:inline">|</span>
                  </span>
                )}
                <Button
                  type="button"
                  variant="brand-nav"
                  aria-disabled="true"
                  className="h-auto rounded-none p-0 text-xs leading-[18px] font-normal text-text-secondary xl:leading-5"
                >
                  <span data-footer-full-label={shortLabel ? "" : undefined}>
                    {label}
                  </span>
                  {shortLabel && (
                    <span data-footer-short-label className="hidden">
                      {shortLabel}
                    </span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div
        data-footer-social
        className="order-1 flex items-center gap-3 xl:order-2"
      >
        <Button
          type="button"
          variant="brand-nav"
          aria-disabled="true"
          aria-label={FOOTER_CONTENT.instagramLabel}
          className="size-5 p-0 text-text-secondary has-[>svg]:px-0"
        >
          <Instagram aria-hidden="true" className="size-5" />
        </Button>
        <Button
          type="button"
          variant="brand-nav"
          aria-disabled="true"
          aria-label={FOOTER_CONTENT.facebookLabel}
          className="size-5 p-0 text-text-secondary has-[>svg]:px-0"
        >
          <Facebook aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </div>
  );
}
