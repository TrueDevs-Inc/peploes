"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "@/components/app/molecules/menu-navigation.module.css";
import { FOCUS_RING, MENU_ROUTES } from "@/lib/constants";
import { getSelectedMenu } from "@/lib/menu-selection";
import type { IMenuNavigationProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuNavigation({
  items,
  label,
  className,
}: IMenuNavigationProps) {
  const searchParams = useSearchParams();
  const selection = searchParams.getAll("menu");
  const activeHref =
    MENU_ROUTES[getSelectedMenu(selection.length === 1 ? selection[0] : null)];
  const [openHref, setOpenHref] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasAlignedTab = useRef(false);
  const openItem = items.find((item) => item.href === openHref);

  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const indicator = indicatorRef.current;
    if (!scroll || !indicator) return;
    const update = () => {
      const target = Array.from(
        scroll.querySelectorAll<HTMLElement>("[data-menu-path]"),
      ).find((item) => item.dataset.menuPath === activeHref);
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      indicator.style.width = `${bounds.width}px`;
      indicator.style.transform = `translateX(${bounds.left - scroll.getBoundingClientRect().left + scroll.scrollLeft}px)`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroll);
    for (const target of scroll.querySelectorAll<HTMLElement>(
      "[data-menu-path]",
    ))
      observer.observe(target);
    return () => observer.disconnect();
  }, [activeHref]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    scroll.scrollTo({ left: scroll.scrollLeft, behavior: "instant" });
    const active = Array.from(
      scroll.querySelectorAll<HTMLElement>("[data-menu-path]"),
    ).find((item) => item.dataset.menuPath === activeHref);
    if (!active) return;
    const bounds = active.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    const left = bounds.left - viewport.left;
    const right = bounds.right - viewport.right;
    let distance = 0;
    if (left < 0) distance = left - 8;
    else if (right > 0) distance = right + 8;
    if (Math.abs(distance) > 1)
      scroll.scrollBy({
        left: distance,
        behavior:
          hasAlignedTab.current &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "smooth"
            : "instant",
      });
    hasAlignedTab.current = true;
  }, [activeHref]);

  useEffect(() => {
    if (!openHref) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !navRef.current?.contains(event.target)
      )
        setOpenHref(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [openHref]);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "Escape" && openHref) {
          setOpenHref(null);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpenHref(null);
        }
      }}
      className={cn(
        className,
        "sticky top-[72px] z-30 bg-warm-cream pt-4 text-[#221a17] shadow-[inset_0_-1px_0_var(--soft-stone)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-[linear-gradient(180deg,rgba(46,42,40,0.1),transparent)] xl:top-[76px]",
        "xl:pt-2",
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          "relative overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <ul
          className={cn(
            styles.tabs,
            "mx-2 flex min-h-12 bg-[#fbf8f2] shadow-[inset_0_-1px_0_var(--soft-stone)] xl:site-container xl:min-w-max",
          )}
        >
          {items.map((item) => {
            const isOpen = openHref === item.href;
            const currentPage = activeHref === item.href ? "page" : undefined;
            const controlsId = isOpen ? "menu-subnavigation" : undefined;

            return (
              <li
                key={item.href}
                className={cn(
                  "flex shrink-0",
                  item.children &&
                    "relative before:absolute before:top-3 before:left-0 before:h-6 before:w-px before:bg-soft-stone [&:nth-last-child(2)]:xl:ml-auto [&:nth-last-child(2)>button]:xl:w-[200px] [&:last-child>button]:xl:w-[183px]",
                )}
              >
                {item.children?.length ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={controlsId}
                    aria-current={currentPage}
                    data-menu-path={item.href}
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setOpenHref(isOpen ? null : (item.href ?? null));
                    }}
                    className={cn(
                      FOCUS_RING,
                      "flex items-center justify-center gap-2 border-b-2 border-transparent px-[22px] text-xl leading-6 hover:text-[#8a1735] focus-visible:ring-peploe-burgundy aria-expanded:text-peploe-burgundy aria-[current=page]:text-[#8a1735]",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("size-4", isOpen && "rotate-180")}
                    />
                  </button>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    scroll={false}
                    aria-current={currentPage}
                    data-menu-path={item.href}
                    onClick={() => setOpenHref(null)}
                    className={cn(
                      FOCUS_RING,
                      "flex min-w-24 items-center xl:min-w-0 justify-center border-b-2 border-transparent px-[22px] text-xl leading-6 hover:text-[#8a1735] focus-visible:ring-peploe-burgundy aria-[current=page]:text-[#8a1735]",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
        <span
          ref={indicatorRef}
          aria-hidden="true"
          data-menu-indicator
          className={styles.indicator}
        />
      </div>
      <div className="xl:site-container xl:relative">
        {openItem?.children && (
          <ul
            id="menu-subnavigation"
            aria-label={openItem.label}
            className={cn(
              "border border-soft-stone bg-[#f1e9e3] px-6 py-0 xl:absolute xl:top-0 xl:right-0 xl:min-w-[200px] xl:px-0 xl:shadow-md",
              openItem.href === items.at(-2)?.href && "xl:right-[183px]",
            )}
          >
            {openItem.children.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpenHref(null)}
                  className={cn(
                    FOCUS_RING,
                    "block px-0 py-3 text-base hover:bg-peploe-burgundy/5 hover:text-peploe-burgundy focus-visible:ring-peploe-burgundy xl:px-6",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
