"use client";

import { useEffect, useRef } from "react";

type LeafletMapInstance = {
  remove: () => void;
  fitBounds: (bounds: [number, number][]) => void;
  setView: (coords: [number, number], zoom: number) => void;
};

type LeafletNamespace = {
  map: (container: HTMLElement) => LeafletMapInstance;
  tileLayer: (
    url: string,
    options: { attribution: string }
  ) => { addTo: (map: LeafletMapInstance) => void };
  marker: (coords: [number, number]) => {
    addTo: (map: LeafletMapInstance) => { bindPopup: (html: string) => void };
  };
};

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

export default function CoverageLeafletMap({ areas }: { areas: any[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ensureStylesheet = () => {
      const existing = document.querySelector('link[data-leaflet="true"]');
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    };

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.L) {
          resolve();
          return;
        }
        const existing = document.querySelector('script[data-leaflet="true"]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Failed to load Leaflet")), {
            once: true,
          });
          return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.crossOrigin = "";
        script.setAttribute("data-leaflet", "true");
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Leaflet"));
        document.body.appendChild(script);
      });

    const initMap = async () => {
      if (!mapRef.current) return;
      ensureStylesheet();
      await loadScript();
      if (cancelled || !mapRef.current || !window.L) return;

      if (!mapInstanceRef.current) {
        const map = window.L.map(mapRef.current);
        mapInstanceRef.current = map;
        window.L
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .addTo(map);

        const markers: [number, number][] = [];

        areas.forEach((area) => {
          if (area.latitude == null || area.longitude == null) return;
          const coords: [number, number] = [area.latitude, area.longitude];
          window.L?.marker(coords).addTo(map).bindPopup(
            `<strong>${area.name}</strong><br />Postcode area: ${area.postcodePrefix}`
          );
          markers.push(coords);
        });

        if (markers.length > 0) {
          map.fitBounds(markers);
        } else {
          // Default view if no markers match
          map.setView([51.5, -0.6], 10);
        }
      }
    };

    void initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [areas]);

  return <div ref={mapRef} className="h-[420px] w-full" aria-label="Autopilot coverage locations map" />;
}
