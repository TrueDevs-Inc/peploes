"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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

const HOVER_CLOSE_DELAY_MS = 350;

export function DesktopNavigation({ items }: IDesktopNavigationProps) {
  const [openItem, setOpenItem] = useState<IOpenDesktopNavigation | null>(null);
  const navigationRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLLIElement>(null);
  const backdropRef = useRef<HTMLLIElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationId = useId();
  const isDesktop = useMediaQuery(DESKTOP_NAVIGATION_QUERY);
  const pathname = usePathname();
  const isSeasonalDetail = pathname.startsWith(`${ROUTES.WHATS_ON}/`);
  const activeNavigationId = pathname.startsWith(ROUTES.MENUS)
    ? "menus"
    : pathname.startsWith(ROUTES.PRIVATE_DINING)
      ? NAVBAR_CONTENT.groupsId
      : null;
  const currentId =
    pathname === ROUTES.VISIT_CONTACT
      ? ROUTES.VISIT_CONTACT
      : items.find(
          ({ id, href }) =>
            id === activeNavigationId ||
            href === pathname ||
            (href === ROUTES.WHATS_ON && isSeasonalDetail),
        )?.id;
  const openId = openItem?.id;
  const openIndex = items.findIndex(({ id }) => id === openItem?.id);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    const indicator = indicatorRef.current;
    const backdrop = backdropRef.current;
    if (!navigation || !indicator || !backdrop) return;
    const trigger = Array.from(
      navigation
        .closest("header")
        ?.querySelectorAll<HTMLElement>("[data-navigation-id]") ?? [],
    ).find((node) => node.dataset.navigationId === currentId);
    const panel = openId
      ? navigation.querySelector<HTMLElement>(
          '[data-navigation-panel][aria-hidden="false"]',
        )
      : null;
    let readyFrame = 0;

    function measure() {
      if (trigger && isDesktop) {
        const bounds = trigger.getBoundingClientRect();
        const headerLeft =
          navigation?.closest("header")?.getBoundingClientRect().left ?? 0;
        indicator?.style.setProperty(
          "transform",
          `translateX(${bounds.left - headerLeft}px)`,
        );
        indicator?.style.setProperty("width", `${bounds.width}px`);
      }
      backdrop?.style.setProperty(
        "height",
        `${isDesktop && panel ? panel.getBoundingClientRect().height : 0}px`,
      );
    }

    measure();
    if (trigger && isDesktop) {
      readyFrame = requestAnimationFrame(() => {
        indicator.dataset.ready = "true";
      });
    }
    const observer = new ResizeObserver(measure);
    observer.observe(navigation);
    if (trigger) observer.observe(trigger);
    if (panel) observer.observe(panel);
    return () => {
      cancelAnimationFrame(readyFrame);
      observer.disconnect();
    };
  }, [currentId, openId, isDesktop]);

  function cancelClose() {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!isDesktop) {
      setOpenItem(null);
    }
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
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [openItem]);

  return (
    <ul
      ref={navigationRef}
      data-navbar-primary
      className={cn(
        styles.navigation,
        "hidden h-full flex-1 items-center gap-[30px] xl:flex",
      )}
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest("a[href]"))
          setOpenItem(null);
      }}
    >
      <li
        aria-hidden="true"
        data-navbar-backdrop
        ref={backdropRef}
        data-open={Boolean(openItem) && isDesktop}
        className={styles.backdrop}
      />
      <li
        aria-hidden="true"
        data-navbar-indicator
        ref={indicatorRef}
        data-visible={Boolean(currentId) && isDesktop}
        className={styles.indicator}
      />
      {items.map((item, index) => {
        const { id, href, content } = item;
        const isOpen = openItem?.id === id;
        const panelId = `${navigationId}-${encodeURIComponent(id)}`;

        return (
          <li
            key={id}
            ref={isOpen ? activeItemRef : undefined}
            className="flex h-full items-center"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && content) {
                cancelClose();
                setOpenItem((current) => {
                  return current?.id === id ? current : { id, source: "hover" };
                });
              }
            }}
            onPointerLeave={(event) => {
              if (
                isOpen &&
                event.pointerType === "mouse" &&
                !event.currentTarget.contains(document.activeElement)
              ) {
                cancelClose();
                closeTimerRef.current = setTimeout(() => {
                  closeTimerRef.current = null;
                  setOpenItem((current) =>
                    current?.id === id ? null : current,
                  );
                }, HOVER_CLOSE_DELAY_MS);
              }
            }}
            onFocus={() => {
              cancelClose();
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
              isActive={currentId === id}
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
                data-navigation-panel
                data-direction={index > openIndex ? "right" : "left"}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className={cn(styles.panel, isOpen && styles.open)}
              >
                <div className={styles.content}>{content}</div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
