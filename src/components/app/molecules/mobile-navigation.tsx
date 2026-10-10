"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { CloseButton } from "@/components/app/atoms/close-button";
import { MobileNavigationTrigger } from "@/components/app/atoms/mobile-navigation-trigger";
import { NavbarBookingButton } from "@/components/app/atoms/navbar-booking-button";
import { NavbarBrand } from "@/components/app/atoms/navbar-brand";
import styles from "@/components/app/molecules/mobile-navigation.module.css";
import { MobileNavigationDetails } from "@/components/app/molecules/mobile-navigation-details";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DESKTOP_NAVIGATION_QUERY, FOCUS_RING } from "@/lib/constants";
import { MOBILE_NAVIGATION_CONTENT } from "@/lib/constants/mobile-navigation";
import type {
  IMobileNavigationItem,
  IMobileNavigationProps,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileNavigation({
  brandPhraseClassName,
}: IMobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_NAVIGATION_QUERY);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isDesktop) dialogRef.current?.close();
  }, [isDesktop]);

  function openMenu() {
    dialogRef.current?.showModal();
    closeButtonRef.current?.querySelector("button")?.focus();
    setIsOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <div className="xl:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={MOBILE_NAVIGATION_CONTENT.openLabel}
        aria-controls={dialogId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={openMenu}
        className={cn(
          FOCUS_RING,
          "size-11 rounded-sm text-ink transition-colors duration-(--duration-fast) hover:bg-soft-stone/40 hover:text-ink focus-visible:ring-peploe-burgundy motion-reduce:transition-none",
        )}
      >
        <Menu aria-hidden="true" className="size-6" />
      </Button>
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        onClose={() => {
          setIsOpen(false);
          setExpandedSection(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeMenu();
          }
        }}
        className={cn(
          styles.dialog,
          "fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-y-auto overscroll-contain border-0 bg-warm-cream p-0 text-ink backdrop:bg-ink/40",
        )}
      >
        <div className="min-h-full">
          <h2 id={titleId} className="sr-only">
            {MOBILE_NAVIGATION_CONTENT.title}
          </h2>
          <div className="flex h-[72px] items-center justify-between gap-2 px-6 shadow-[inset_0_-1px_0_var(--soft-stone)]">
            <NavbarBrand onClick={closeMenu} />
            <div className="flex shrink-0 items-center gap-3">
              <NavbarBookingButton />
              <div ref={closeButtonRef}>
                <CloseButton
                  onClick={closeMenu}
                  ariaLabel={MOBILE_NAVIGATION_CONTENT.closeLabel}
                  className={cn(
                    FOCUS_RING,
                    "static size-11 rounded-sm border-transparent text-ink transition-colors duration-(--duration-fast) hover:border-transparent hover:bg-soft-stone/40 hover:text-ink focus-visible:ring-peploe-burgundy motion-reduce:transition-none [&>svg]:size-6",
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 px-6 pt-6 pb-7">
            <nav aria-label={MOBILE_NAVIGATION_CONTENT.navigationLabel}>
              <ul className="flex flex-col gap-1">
                {MOBILE_NAVIGATION_CONTENT.items.map(
                  (item: IMobileNavigationItem) => {
                    const isExpanded = expandedSection === item.id;
                    const panelId = `${dialogId}-${item.id}`;

                    return (
                      <li
                        key={item.id}
                        className="not-last:after:mt-1 not-last:after:block not-last:after:h-px not-last:after:bg-soft-stone"
                      >
                        <MobileNavigationTrigger
                          item={item}
                          isExpanded={isExpanded}
                          panelId={panelId}
                          onNavigate={closeMenu}
                          onToggle={() =>
                            setExpandedSection((currentSection) =>
                              currentSection === item.id ? null : item.id,
                            )
                          }
                        />
                        {item.children && (
                          <div
                            id={panelId}
                            aria-hidden={!isExpanded}
                            inert={!isExpanded}
                            className={cn(
                              "grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none",
                              isExpanded
                                ? "visible mt-1 grid-rows-[1fr]"
                                : "invisible grid-rows-[0fr]",
                            )}
                          >
                            <div className="min-h-0 overflow-hidden">
                              <ul className="flex flex-col gap-1 pt-1 pb-2 pl-6">
                                {item.children.map(({ label, href }) => (
                                  <li key={label}>
                                    <Button
                                      asChild={Boolean(href)}
                                      type={href ? undefined : "button"}
                                      variant="brand-nav"
                                      aria-disabled={href ? undefined : true}
                                      className={cn(
                                        FOCUS_RING,
                                        "h-auto min-h-11 w-full justify-start rounded-none p-0 text-left text-sm leading-[21px] font-normal whitespace-normal focus-visible:ring-peploe-burgundy",
                                      )}
                                    >
                                      {href ? (
                                        <Link href={href} onClick={closeMenu}>
                                          {label}
                                        </Link>
                                      ) : (
                                        label
                                      )}
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  },
                )}
              </ul>
            </nav>
            <Button
              type="button"
              variant="brand-contact"
              aria-disabled="true"
              className="h-12 w-full rounded-[4px] border-peploe-burgundy px-6 py-[13px] text-base leading-[22px] font-medium"
            >
              {MOBILE_NAVIGATION_CONTENT.giftVouchersLabel}
            </Button>
            <MobileNavigationDetails
              brandPhraseClassName={brandPhraseClassName}
            />
          </div>
        </div>
      </dialog>
    </div>
  );
}
