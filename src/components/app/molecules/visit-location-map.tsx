"use client";

import { LocateFixed } from "lucide-react";
import type { Map as MapboxMap } from "mapbox-gl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

import layout from "@/components/app/compounds/visit-contact.module.css";
import styles from "@/components/app/molecules/visit-location-map.module.css";
import {
  VISIT_CONTACT_CONTENT,
  VISIT_MAP,
} from "@/lib/constants/visit-contact";
import { env } from "@/lib/env";

export function VisitLocationMap() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = VISIT_CONTACT_CONTENT.location.map;
  const token = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!token || !container.current) return;
    let disposed = false;
    let failedToLoad = false;
    let loaded = false;
    let map: MapboxMap | undefined;
    const element = container.current;

    function fail() {
      if (disposed) return;
      failedToLoad = true;
      clearTimeout(timeout);
      setFailed(true);
      map?.remove();
      map = undefined;
      mapRef.current = null;
    }

    const timeout = setTimeout(fail, VISIT_MAP.loadTimeoutMs);

    async function initialize() {
      try {
        const mapbox = (await import("mapbox-gl")).default;
        if (disposed || failedToLoad) return;
        if (!mapbox.supported()) {
          fail();
          return;
        }
        map = new mapbox.Map({
          container: element,
          accessToken: token,
          style: env.NEXT_PUBLIC_MAPBOX_STYLE_URL,
          center: [...VISIT_MAP.center],
          zoom: VISIT_MAP.zoom,
          minZoom: VISIT_MAP.minZoom,
          maxZoom: VISIT_MAP.maxZoom,
          scrollZoom: false,
          cooperativeGestures: true,
          attributionControl: true,
        });
        mapRef.current = map;
        map.addControl(new mapbox.NavigationControl({ showCompass: false }));
        map.addControl(
          new mapbox.FullscreenControl({
            container: element.parentElement ?? element,
          }),
        );
        map.once("load", () => {
          if (disposed || !map) return;
          customizeDefaultStyle(map);
          const marker = document.createElement("button");
          marker.type = "button";
          marker.className = styles.marker;
          marker.setAttribute(
            "aria-label",
            VISIT_CONTACT_CONTENT.location.map.markerLabel,
          );
          const popup = document.createElement("p");
          popup.className = styles.popupAddress;
          popup.textContent = VISIT_CONTACT_CONTENT.contact.address;
          new mapbox.Marker({ element: marker, anchor: "bottom" })
            .setLngLat([...VISIT_MAP.center])
            .setPopup(
              new mapbox.Popup({ anchor: "top", offset: 8 }).setDOMContent(
                popup,
              ),
            )
            .addTo(map);
          clearTimeout(timeout);
          loaded = true;
          setReady(true);
        });
        map.on("error", () => {
          if (!loaded) fail();
        });
      } catch {
        fail();
      }
    }

    void initialize();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className={`${layout.map} ${styles.shell}`}
      aria-busy={Boolean(token) && !ready && !failed}
    >
      <section
        ref={container}
        className={styles.canvas}
        aria-label={copy.label}
        aria-hidden={!ready}
      />
      {!ready ? (
        <Image
          src={copy.src}
          alt={copy.alt}
          fill
          sizes="(min-width: 1584px) 844px, (min-width: 1024px) 53vw, calc(100vw - 48px)"
          className={layout.cover}
        />
      ) : null}
      {!token || failed ? (
        <p className={styles.notice} role="status">
          {copy.unavailable}
        </p>
      ) : null}
      {ready ? (
        <button
          type="button"
          className={styles.recenter}
          aria-label={copy.recenterLabel}
          onClick={() =>
            mapRef.current?.flyTo({
              center: [...VISIT_MAP.center],
              zoom: VISIT_MAP.zoom,
              essential: false,
            })
          }
        >
          <LocateFixed size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function customizeDefaultStyle(map: MapboxMap) {
  // Keep a supplied Studio style intact; brand only the default light style.
  if (env.NEXT_PUBLIC_MAPBOX_STYLE_URL !== "mapbox://styles/mapbox/light-v11")
    return;
  for (const layer of map.getStyle().layers) {
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", VISIT_MAP.colors.land);
    } else if (
      layer.type === "fill" &&
      /water|park|landuse|landcover/.test(layer.id)
    ) {
      const color = layer.id.includes("water")
        ? VISIT_MAP.colors.water
        : VISIT_MAP.colors.park;
      map.setPaintProperty(layer.id, "fill-color", color);
    }
  }
}
