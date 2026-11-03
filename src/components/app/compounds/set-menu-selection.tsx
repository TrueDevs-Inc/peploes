"use client";

import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import { MenuCourse } from "@/components/app/molecules/menu-course";
import { FOCUS_RING } from "@/lib/constants";
import { ebGaramond } from "@/lib/fonts";
import { formatMenuPrice } from "@/lib/menu-price";
import { selectMenuSection } from "@/lib/menu-selection";
import type { ISetMenuSelectionProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetMenuSelection({ menu, children }: ISetMenuSelectionProps) {
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => "");
  const selectionRef = useRef<HTMLDivElement>(null);
  const focusHeading = useRef(false);
  const selected =
    menu.menus.find(
      (set) =>
        hash === set._key ||
        hash === `${set._key}-title` ||
        set.courses.some((course) => hash === `${set._key}-${course._key}`),
    ) ?? menu.menus[0];
  const alternatives = menu.menus.filter((set) => set !== selected);

  useLayoutEffect(() => {
    const target =
      hash === `${menu.slug}-introduction` || hash === selected?._key
        ? selectionRef.current
        : document.getElementById(hash);
    target?.scrollIntoView({ behavior: "instant", block: "start" });
    if (focusHeading.current && selected) {
      focusHeading.current = false;
      document
        .getElementById(`${selected._key}-title`)
        ?.focus({ preventScroll: true });
    }
  }, [hash, menu.slug, selected]);

  return (
    <div
      ref={selectionRef}
      id={selected?._key}
      className="site-container scroll-mt-40 pb-8 [&_h2[id]]:scroll-mt-40"
    >
      {children}
      {selected && (
        <section key={selected._key} aria-labelledby={`${selected._key}-title`}>
          <header
            data-scroll-reveal
            className="border-b border-soft-stone bg-[#f1e9e3] px-4 py-6 text-center xl:py-4"
          >
            <h2
              id={`${selected._key}-title`}
              tabIndex={-1}
              className={cn(
                ebGaramond.className,
                "text-[38px] leading-[44px] focus:outline-none xl:text-[42px] xl:leading-[50px]",
              )}
            >
              {selected.title}
            </h2>
            <p className="mt-2 text-base">
              {formatMenuPrice(selected.price)} per person
            </p>
            <p className="mt-3 text-sm leading-5 text-text-secondary">
              {selected.summary}
            </p>
            {selected.inclusions.length > 0 && (
              <div className="mx-auto mt-2 hidden max-w-[800px] items-center justify-center gap-2.5 border-t border-soft-stone pt-2 text-sm leading-[18px] text-text-secondary xl:flex">
                {menu.inclusionsHeading && (
                  <p className="text-peploe-burgundy uppercase xl:border-r xl:border-soft-stone xl:pr-2.5">
                    {menu.inclusionsHeading}
                  </p>
                )}
                <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                  {selected.inclusions.map((note, index) => (
                    <li key={note} className="flex items-center gap-5">
                      {index > 0 && (
                        <span aria-hidden="true" className="hidden xl:inline">
                          •
                        </span>
                      )}
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </header>
          {selected.courses.map((course) => (
            <MenuCourse
              key={course._key}
              course={course}
              idPrefix={selected._key}
              compact
            />
          ))}
        </section>
      )}
      {alternatives.length > 0 && (
        <nav
          data-scroll-reveal
          aria-label={`${menu.title} sections`}
          className="mt-6 grid gap-3 xl:mt-8 xl:grid-cols-4 xl:gap-6"
        >
          {alternatives.map((set) => (
            <a
              key={set._key}
              href={`#${set._key}`}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                focusHeading.current = true;
                selectMenuSection(`#${set._key}`);
              }}
              className={cn(
                FOCUS_RING,
                "flex items-center justify-between gap-5 border border-soft-stone bg-[#fcfaf6] px-4 py-4 hover:border-peploe-burgundy focus-visible:ring-peploe-burgundy xl:col-span-2 xl:px-6",
                alternatives.length === 1 && "xl:col-start-2",
              )}
            >
              <div>
                <h2
                  className={cn(
                    ebGaramond.className,
                    "text-[25px] leading-8 xl:text-[26px]",
                  )}
                >
                  {set.title}
                </h2>
                <p className="mt-1 text-[13px] leading-[18px] text-text-secondary xl:text-sm">
                  {formatMenuPrice(set.price)} per person
                  <span aria-hidden="true" className="px-2">
                    |
                  </span>
                  {set.serviceTimes ?? set.cardDescription ?? set.summary}
                </p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-peploe-burgundy">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function getHash() {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}
