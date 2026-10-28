import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { CookiePreferences } from "@/components/app/molecules/cookie-preferences";
import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";

export function FooterMeta() {
  return (
    <div
      data-footer-meta
      className="relative mt-16 flex flex-col gap-4 text-sm leading-[21px] text-text-secondary xl:flex-row xl:items-center xl:justify-between xl:gap-6 xl:pt-[25px] xl:text-xs xl:leading-5 xl:before:absolute xl:before:inset-x-0 xl:before:top-0 xl:before:h-px xl:before:bg-soft-stone"
    >
      <div
        data-footer-legal
        className="order-2 flex flex-col gap-2 xl:order-1 xl:flex-row xl:items-center xl:gap-4"
      >
        <p className="order-2 text-center xl:order-none xl:text-left">
          {FOOTER_CONTENT.copyright}
        </p>
        <span aria-hidden="true" className="hidden xl:inline">
          |
        </span>
        <nav aria-label={FOOTER_CONTENT.legalNavigationLabel}>
          <ul className="flex flex-col flex-wrap items-start gap-x-4 xl:flex-row xl:items-center xl:gap-y-2">
            {FOOTER_CONTENT.legalLabels.map(
              ({ label, shortLabel, href }, index) => {
                const linkLabel = (
                  <>
                    <span data-footer-full-label={shortLabel ? "" : undefined}>
                      {label}
                    </span>
                    {shortLabel && (
                      <span data-footer-short-label className="hidden">
                        {shortLabel}
                      </span>
                    )}
                  </>
                );

                return (
                  <li key={label} className="flex items-center gap-3 xl:gap-4">
                    {index > 0 && (
                      <span aria-hidden="true" className="hidden xl:inline">
                        |
                      </span>
                    )}
                    <Button
                      asChild
                      variant="brand-nav"
                      className="min-h-11 min-w-11 h-auto justify-start rounded-none p-0 text-sm leading-[21px] font-normal text-text-secondary xl:min-h-0 xl:min-w-0 xl:justify-center xl:text-xs xl:leading-5"
                    >
                      <Link href={href}>{linkLabel}</Link>
                    </Button>
                  </li>
                );
              },
            )}
            <li className="flex items-center gap-3 xl:gap-4">
              <span aria-hidden="true" className="hidden xl:inline">
                |
              </span>
              <CookiePreferences />
            </li>
          </ul>
        </nav>
      </div>
      <div
        data-footer-social
        className="order-1 flex items-center gap-3 xl:order-2"
      >
        <Button
          asChild
          variant="brand-nav"
          aria-label={FOOTER_CONTENT.instagramLabel}
          className="size-11 p-0 text-text-secondary has-[>svg]:px-0 xl:size-5"
        >
          <a
            href={FOOTER_CONTENT.instagramHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram aria-hidden="true" className="size-5" />
          </a>
        </Button>
        <Button
          asChild
          variant="brand-nav"
          aria-label={FOOTER_CONTENT.facebookLabel}
          className="size-11 p-0 text-text-secondary has-[>svg]:px-0 xl:size-5"
        >
          <a
            href={FOOTER_CONTENT.facebookHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook aria-hidden="true" className="size-5" />
          </a>
        </Button>
      </div>
    </div>
  );
}
