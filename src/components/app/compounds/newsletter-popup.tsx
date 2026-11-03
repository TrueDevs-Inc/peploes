"use client";

import { useEffect, useRef, useState } from "react";
import { CloseButton } from "@/components/app/atoms/close-button";
import { NewsletterSignup } from "@/components/app/molecules/newsletter-signup";
import { NEWSLETTER_SUBSCRIPTION, ROUTES } from "@/lib/constants";
import { FOOTER_CONTENT } from "@/lib/constants/footer";
import { NEWSLETTER_POPUP } from "@/lib/constants/newsletter-popup";
import { ebGaramond } from "@/lib/fonts";
import { hasNewsletterSubscription } from "@/lib/newsletter-subscription";
import { cn } from "@/lib/utils";

let shownThisVisit = false;

function remember(key: string, value = "true") {
  shownThisVisit = true;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function anotherTaskIsActive() {
  return (
    document.activeElement?.matches(
      "summary, input, select, textarea, button",
    ) ||
    (document.activeElement instanceof HTMLAnchorElement &&
      document.activeElement.pathname === ROUTES.BOOK_A_TABLE) ||
    Boolean(
      document.querySelector(
        'dialog[open], [role="dialog"][aria-modal="true"]',
      ),
    )
  );
}

export function NewsletterPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownThisVisit || hasNewsletterSubscription()) return;
    try {
      const lastShown = Number(
        localStorage.getItem(NEWSLETTER_POPUP.lastShownKey),
      );
      if (
        localStorage.getItem(NEWSLETTER_POPUP.dismissedKey) ||
        (lastShown > 0 && Date.now() - lastShown < NEWSLETTER_POPUP.cooldownMs)
      )
        return;
    } catch {}
    const trigger = document.querySelector(NEWSLETTER_POPUP.triggerSelector);
    const dialog = dialogRef.current;
    if (!trigger || !dialog) return;
    let previousFocus: HTMLElement | null = null;
    let previousOverflow = "";
    const markSubscribed = () => {
      shownThisVisit = true;
      observer.disconnect();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || entry.boundingClientRect.bottom >= 0) return;
      observer.disconnect();
      if (shownThisVisit) return;
      if (anotherTaskIsActive()) return;
      remember(NEWSLETTER_POPUP.lastShownKey, String(Date.now()));
      previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setOpen(true);
      dialog.showModal();
    });
    observer.observe(trigger);
    window.addEventListener(
      NEWSLETTER_SUBSCRIPTION.acceptedEvent,
      markSubscribed,
    );
    const restore = () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
    dialog.addEventListener("close", restore);
    return () => {
      observer.disconnect();
      window.removeEventListener(
        NEWSLETTER_SUBSCRIPTION.acceptedEvent,
        markSubscribed,
      );
      dialog.removeEventListener("close", restore);
      if (dialog.open) {
        dialog.close();
        restore();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="newsletter-popup-heading"
      aria-describedby="newsletter-popup-description"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), a[href]",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClose={() => {
        remember(NEWSLETTER_POPUP.dismissedKey);
        setOpen(false);
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-sm border border-soft-stone bg-warm-cream p-6 text-ink shadow-xl backdrop:bg-black/40 sm:p-10"
    >
      <CloseButton
        ariaLabel={NEWSLETTER_POPUP.closeLabel}
        className="size-11 text-peploe-burgundy"
        onClick={() => dialogRef.current?.close()}
      />
      <h2
        id="newsletter-popup-heading"
        className={cn(
          ebGaramond.className,
          "mt-10 text-3xl text-peploe-burgundy sm:mt-6",
        )}
      >
        {FOOTER_CONTENT.newsletter.heading}
      </h2>
      <p id="newsletter-popup-description" className="mt-4 text-base">
        {FOOTER_CONTENT.newsletter.description}
      </p>
      {open && <NewsletterSignup />}
    </dialog>
  );
}
