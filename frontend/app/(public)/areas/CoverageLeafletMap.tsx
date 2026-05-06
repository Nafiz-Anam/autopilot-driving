"use client";

import { useEffect, useRef } from "react";

const COVERAGE_LOCATIONS = [
  { name: "Slough", postcode: "SL1", coords: [51.5105, -0.595] as [number, number] },
  { name: "Windsor", postcode: "SL4", coords: [51.4839, -0.6044] as [number, number] },
  { name: "Maidenhead", postcode: "SL6", coords: [51.5229, -0.7199] as [number, number] },
  { name: "Reading", postcode: "RG1", coords: [51.4543, -0.9781] as [number, number] },
  { name: "Wokingham", postcode: "RG40", coords: [51.4112, -0.8339] as [number, number] },
  { name: "Bracknell", postcode: "RG12", coords: [51.416, -0.75] as [number, number] },
  { name: "Staines", postcode: "TW18", coords: [51.4322, -0.5045] as [number, number] },
  { name: "Feltham", postcode: "TW13", coords: [51.4479, -0.4088] as [number, number] },
  { name: "Hounslow", postcode: "TW3", coords: [51.4681, -0.3613] as [number, number] },
];

type LeafletMapInstance = {
  remove: () => void;
  fitBounds: (bounds: [number, number][]) => void;
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

export default function CoverageLeafletMap() {
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

        COVERAGE_LOCATIONS.forEach((location) => {
          window.L?.marker(location.coords).addTo(map).bindPopup(
            `<strong>${location.name}</strong><br />Postcode area: ${location.postcode}`
          );
        });

        map.fitBounds(COVERAGE_LOCATIONS.map((location) => location.coords));
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
  }, []);

  return <div ref={mapRef} className="h-[420px] w-full" aria-label="Autopilot coverage locations map" />;
}
