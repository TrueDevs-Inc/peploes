"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { CloseButton } from "@/components/app/atoms/close-button";
import { MobileNavigationTrigger } from "@/components/app/atoms/mobile-navigation-trigger";
import { NavbarBookingButton } from "@/components/app/atoms/navbar-booking-button";
import { NavbarBrand } from "@/components/app/atoms/navbar-brand";
import styles from "@/components/app/molecules/mobile-navigation.module.css";
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
  const [isClosing, setIsClosing] = useState(false);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isClosing || !dialog) return;
    let cancelled = false;
    const animations = dialog
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.effect instanceof KeyframeEffect &&
          animation.effect.target === dialog,
      );
    void Promise.allSettled(
      animations.map((animation) => animation.finished),
    ).then(() => {
      if (!cancelled) dialog.close();
    });
    return () => {
      cancelled = true;
    };
  }, [isClosing]);

  function openMenu() {
    dialogRef.current?.showModal();
    closeButtonRef.current?.querySelector("button")?.focus();
    setIsOpen(true);
  }

  function closeMenu() {
    setIsClosing(true);
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
          "size-11 justify-end rounded-sm text-ink transition-colors duration-(--duration-fast) hover:bg-soft-stone/40 hover:text-ink focus-visible:ring-peploe-burgundy motion-reduce:transition-none",
        )}
      >
        <Menu aria-hidden="true" className="size-6" />
      </Button>
      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        data-closing={isClosing || undefined}
        onClose={() => {
          setIsOpen(false);
          setIsClosing(false);
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
          "fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-warm-cream p-0 text-ink backdrop:bg-ink/40",
        )}
      >
        <div className="flex min-h-full flex-col">
          <h2 id={titleId} className="sr-only">
            {MOBILE_NAVIGATION_CONTENT.title}
          </h2>
          <div className="flex h-[72px] items-center justify-between gap-2 px-4 shadow-[inset_0_-1px_0_var(--soft-stone)]">
            <NavbarBrand onClick={closeMenu} />
            <div className="flex shrink-0 items-center gap-3">
              <div ref={closeButtonRef}>
                <CloseButton
                  onClick={closeMenu}
                  ariaLabel={MOBILE_NAVIGATION_CONTENT.closeLabel}
                  className={cn(
                    FOCUS_RING,
                    "static size-11 justify-end rounded-sm border-0 text-ink transition-colors duration-(--duration-fast) hover:bg-soft-stone/40 hover:text-ink focus-visible:ring-peploe-burgundy motion-reduce:transition-none [&>svg]:size-6",
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-7">
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
            <NavbarBookingButton
              onNavigate={closeMenu}
              className="h-12 w-full leading-[22px]"
              label={MOBILE_NAVIGATION_CONTENT.bookingLabel}
            />
            <p
              className={cn(
                brandPhraseClassName,
                "mt-auto pt-2 text-center text-lg leading-[26px] text-peploe-burgundy",
              )}
            >
              {MOBILE_NAVIGATION_CONTENT.brandPhrase}
            </p>
          </div>
        </div>
      </dialog>
    </div>
  );
}
