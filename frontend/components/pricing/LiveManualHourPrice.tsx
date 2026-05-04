"use client";

import { useEffect, useState } from "react";

/** Shows live £/hr for manual “single” lesson from admin pricing (MANUAL / slug single). */
export function LiveManualHourPrice({ className }: { className?: string }) {
  const [v, setV] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/pricing/packages?lessonType=MANUAL", { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (d: {
          success?: boolean;
          data?: { slug: string; price: number; hours: number; pricePerHour: number | null }[];
        }) => {
          const single = d.data?.find((p) => p.slug === "single");
          if (!single) return;
          if (single.pricePerHour != null) {
            setV(single.pricePerHour);
            return;
          }
          if (single.hours > 0) {
            setV(Math.round((single.price / single.hours) * 100) / 100);
          }
        }
      )
      .catch(() => {});
  }, []);

  if (v == null) {
    return (
      <span className={className} aria-hidden>
        £— / hour
      </span>
    );
  }

  return (
    <span className={className}>
      £{v} / hour
    </span>
  );
}
