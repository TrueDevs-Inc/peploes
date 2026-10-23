"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseButton } from "@/components/app/atoms/close-button";
import styles from "@/components/app/molecules/cookie-preferences.module.css";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  COOKIE_PREFERENCES,
  COOKIE_PREFERENCES_CONTENT as content,
} from "@/lib/constants/cookie-consent";
import {
  getCookiePreferences,
  saveCookiePreferences,
} from "@/lib/cookie-consent";
import { dmSans, ebGaramond } from "@/lib/fonts";
import type { ICookiePreferences } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CookiePreferences() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ICookiePreferences>(
    COOKIE_PREFERENCES.defaults,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function persist(next: ICookiePreferences, close = false) {
    if (!saveCookiePreferences(next)) {
      setPreferences(getCookiePreferences());
      setError(true);
      return;
    }
    setPreferences(next);
    setError(false);
    if (close) dialogRef.current?.close();
  }

  return (
    <>
      <Button
        type="button"
        variant="brand-nav"
        aria-haspopup="dialog"
        aria-controls={isOpen ? id : undefined}
        className="min-h-11 min-w-11 h-auto justify-start rounded-none p-0 text-sm leading-[21px] font-normal text-text-secondary xl:min-h-0 xl:min-w-0 xl:justify-center xl:text-xs xl:leading-5"
        onClick={() => {
          setPreferences(getCookiePreferences());
          setError(false);
          setIsOpen(true);
        }}
      >
        {content.trigger}
      </Button>
      {isOpen &&
        createPortal(
          <dialog
            ref={dialogRef}
            id={id}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            onClose={() => setIsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.close();
              }
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
              ) {
                event.currentTarget.close();
              }
            }}
            className={cn(dmSans.className, styles.dialog)}
          >
            <CloseButton
              ariaLabel={content.closeLabel}
              onClick={() => dialogRef.current?.close()}
              className={styles.close}
            />
            <h2
              id={`${id}-title`}
              className={cn(ebGaramond.className, styles.title)}
            >
              {content.title}
            </h2>
            <p id={`${id}-description`} className={styles.description}>
              {content.description}
            </p>
            <div className={styles.category}>
              <div className={styles.row}>
                <h3>{content.necessary.title}</h3>
                <span className={styles.status}>
                  {content.necessary.status}
                </span>
              </div>
              <p>{content.necessary.description}</p>
            </div>
            {content.categories.map(({ key, title, description }) => (
              <div key={key} className={styles.category}>
                <div className={styles.row}>
                  <h3 id={`${id}-${key}`}>{title}</h3>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={preferences[key]}
                    aria-labelledby={`${id}-${key}`}
                    aria-describedby={`${id}-${key}-description`}
                    checked={preferences[key]}
                    onChange={(event) =>
                      persist({ ...preferences, [key]: event.target.checked })
                    }
                    className={styles.toggle}
                  />
                </div>
                <p id={`${id}-${key}-description`}>{description}</p>
              </div>
            ))}
            <Link
              href={ROUTES.PRIVACY_COOKIES}
              onClick={() => dialogRef.current?.close()}
              className={styles.policy}
            >
              {content.policyLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            {error && <p role="alert">{content.storageError}</p>}
            <div className={styles.actions}>
              <Button
                type="button"
                variant="brand-contact"
                onClick={() => persist(COOKIE_PREFERENCES.defaults, true)}
              >
                {content.rejectLabel}
              </Button>
              <Button
                type="button"
                variant="brand-primary"
                onClick={() => persist(COOKIE_PREFERENCES.accepted, true)}
              >
                {content.acceptLabel}
              </Button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
