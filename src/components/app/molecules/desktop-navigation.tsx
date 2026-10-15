"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { DesktopNavigationTrigger } from "@/components/app/atoms/desktop-navigation-trigger";
import styles from "@/components/app/molecules/desktop-navigation.module.css";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DESKTOP_NAVIGATION_QUERY,
  NAVBAR_CONTENT,
  ROUTES,
} from "@/lib/constants";
import type {
  IDesktopNavigationProps,
  IOpenDesktopNavigation,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function DesktopNavigation({ items }: IDesktopNavigationProps) {
  const [openItem, setOpenItem] = useState<IOpenDesktopNavigation | null>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const navigationId = useId();
  const isDesktop = useMediaQuery(DESKTOP_NAVIGATION_QUERY);
  const pathname = usePathname();
  const isSeasonalDetail = pathname.startsWith(`${ROUTES.WHATS_ON}/`);
  const activeNavigationId = pathname.startsWith(ROUTES.MENUS)
    ? "menus"
    : pathname.startsWith(ROUTES.PRIVATE_DINING)
      ? NAVBAR_CONTENT.groupsId
      : null;

  useEffect(() => {
    if (!isDesktop) setOpenItem(null);
  }, [isDesktop]);

  useEffect(() => {
    if (!openItem) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !activeItemRef.current?.contains(event.target)
      ) {
        setOpenItem(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (activeItemRef.current?.contains(document.activeElement)) {
        activeItemRef.current
          ?.querySelector<HTMLElement>("[data-navigation-trigger]")
          ?.focus();
      }
      setOpenItem(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openItem]);

  return (
    <ul
      data-navbar-primary
      className="hidden h-full flex-1 items-center gap-[30px] xl:flex"
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest("a[href]"))
          setOpenItem(null);
      }}
    >
      {items.map((item) => {
        const { id, href, content } = item;
        const isOpen = openItem?.id === id;
        const panelId = `${navigationId}-${encodeURIComponent(id)}`;

        return (
          <li
            key={id}
            ref={isOpen ? activeItemRef : undefined}
            className="flex h-full items-center"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") {
                setOpenItem((current) => {
                  if (!content) return null;
                  return current?.id === id ? current : { id, source: "hover" };
                });
              }
            }}
            onPointerLeave={(event) => {
              if (!event.currentTarget.contains(document.activeElement)) {
                setOpenItem((current) => (current?.id === id ? null : current));
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setOpenItem((current) => (current?.id === id ? null : current));
              }
            }}
          >
            <DesktopNavigationTrigger
              item={item}
              isOpen={isOpen}
              isActive={
                activeNavigationId === id ||
                href === pathname ||
                (href === ROUTES.WHATS_ON && isSeasonalDetail)
              }
              isCurrent={href === pathname}
              panelId={panelId}
              onFocus={() =>
                setOpenItem((current) => (current?.id === id ? current : null))
              }
              onToggle={() =>
                setOpenItem((current) =>
                  current?.id === id && current.source === "activation"
                    ? null
                    : { id, source: "activation" },
                )
              }
              onOpen={() => setOpenItem({ id, source: "activation" })}
            />
            {content && (
              <div
                id={panelId}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className={cn(styles.panel, isOpen && styles.open)}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
