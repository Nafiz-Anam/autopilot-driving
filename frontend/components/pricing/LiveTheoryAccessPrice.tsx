"use client";

import { useEffect, useState } from "react";
import { backendApiUrl } from "@/lib/backend-api";

export function LiveTheoryAccessPrice({ fallback = 9.99 }: { fallback?: number }) {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch(backendApiUrl("/public/pricing/theory-price"), { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: { price: number } }) => {
        if (d.success && d.data?.price != null) setN(d.data.price);
      })
      .catch(() => {});
  }, []);

  const v = n ?? fallback;
  return <>£{Number.isInteger(v) ? v : v.toFixed(2)}</>;
}
