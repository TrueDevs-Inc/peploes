"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FOCUS_RING } from "@/lib/constants";
import type { IMenuNavigationProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MenuNavigation({
  items,
  label,
  className,
}: IMenuNavigationProps) {
  const pathname = usePathname();
  const [openHref, setOpenHref] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const openItem = items.find((item) => item.href === openHref);
  const compactDesktop = items.find(
    (item) => item.href === pathname,
  )?.compactDesktop;

  useEffect(() => {
    const scroll = scrollRef.current;
    const active = Array.from(
      scroll?.querySelectorAll<HTMLElement>("[data-menu-path]") ?? [],
    ).find((item) => item.dataset.menuPath === pathname);
    if (scroll && active)
      scroll.scrollLeft +=
        active.getBoundingClientRect().left -
        scroll.getBoundingClientRect().left -
        scroll.clientWidth / 2 +
        active.clientWidth / 2;
  }, [pathname]);

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
        if (!event.currentTarget.contains(event.relatedTarget))
          setOpenHref(null);
      }}
      className={cn(
        className,
        "sticky top-[72px] z-30 bg-warm-cream pt-4 text-[#221a17] shadow-[inset_0_-1px_0_var(--soft-stone)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-[linear-gradient(180deg,rgba(46,42,40,0.1),transparent)] xl:top-[76px]",
        compactDesktop && "xl:pt-2",
      )}
    >
      <div
        ref={scrollRef}
        className="relative overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="mx-2 flex h-12 min-w-max bg-[#fbf8f2] shadow-[inset_0_-1px_0_var(--soft-stone)] xl:site-container">
          {items.map((item) => {
            const isOpen = openHref === item.href;
            const currentPage = pathname === item.href ? "page" : undefined;
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
                      "flex items-center justify-center gap-2 border-b-2 border-transparent px-[22px] text-xl leading-6 hover:text-[#8a1735] focus-visible:ring-peploe-burgundy aria-expanded:text-peploe-burgundy aria-[current=page]:border-[#8a1735] aria-[current=page]:text-[#8a1735]",
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
                    aria-current={currentPage}
                    data-menu-path={item.href}
                    onClick={() => setOpenHref(null)}
                    className={cn(
                      FOCUS_RING,
                      "flex min-w-24 items-center xl:min-w-0 justify-center border-b-2 border-transparent px-[22px] text-xl leading-6 hover:text-[#8a1735] focus-visible:ring-peploe-burgundy aria-[current=page]:border-[#8a1735] aria-[current=page]:text-[#8a1735]",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="xl:site-container xl:relative">
        {openItem?.children && (
          <ul
            id="menu-subnavigation"
            aria-label={openItem.label}
            className={cn(
              "border border-soft-stone bg-[#f1e9e3] px-6 py-3 xl:absolute xl:top-0 xl:right-0 xl:min-w-[200px] xl:px-0 xl:py-1 xl:shadow-md",
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
