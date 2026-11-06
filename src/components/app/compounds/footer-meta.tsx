import Link from "next/link";
import { FooterCredit } from "@/components/app/atoms/footer-credit";
import { CookiePreferences } from "@/components/app/molecules/cookie-preferences";
import { Button } from "@/components/ui/button";
import { FOOTER_CONTENT } from "@/lib/constants/footer";

export function FooterMeta() {
  return (
    <div
      data-footer-meta
      className="relative mt-16 flex flex-col text-sm leading-[21px] text-text-secondary xl:pt-[25px] xl:text-xs xl:leading-5 xl:before:absolute xl:before:inset-x-0 xl:before:top-0 xl:before:h-px xl:before:bg-soft-stone"
    >
      <div
        data-footer-legal
        className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-4"
      >
        <p className="order-2 text-center xl:order-none xl:text-left">
          {FOOTER_CONTENT.copyright}
        </p>
        <span aria-hidden="true" className="hidden xl:inline">
          |
        </span>
        <nav aria-label={FOOTER_CONTENT.legalNavigationLabel}>
          <ul className="flex flex-wrap items-center justify-around gap-x-px px-0.5 min-[360px]:gap-x-[7px] xl:justify-start xl:gap-x-4 xl:gap-y-2 xl:px-0">
            {FOOTER_CONTENT.legalLabels.map(
              ({ label, shortLabel, href }, index) => {
                const linkLabel = (
                  <>
                    <span
                      data-footer-full-label={shortLabel ? "" : undefined}
                      className={shortLabel ? "hidden xl:inline" : undefined}
                    >
                      {label}
                    </span>
                    {shortLabel && (
                      <span data-footer-short-label className="xl:hidden">
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
                      className="min-h-11 min-w-11 h-auto justify-center rounded-none p-0 text-[11px] leading-[21px] font-normal text-text-secondary min-[360px]:text-xs xl:min-h-0 xl:min-w-0 xl:leading-5"
                    >
                      <Link
                        href={href}
                        aria-label={shortLabel ? label : undefined}
                      >
                        {linkLabel}
                      </Link>
                    </Button>
                  </li>
                );
              },
            )}
            <li hidden>
              <span aria-hidden="true" className="hidden xl:inline">
                |
              </span>
              <CookiePreferences />
            </li>
          </ul>
        </nav>
      </div>
      <FooterCredit />
    </div>
  );
}
