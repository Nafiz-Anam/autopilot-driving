"use client";

import { useEffect, useState } from "react";

export function LiveTheoryAccessPrice({ fallback = 29 }: { fallback?: number }) {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/pricing/packages?lessonType=THEORY", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: { price: number }[] }) => {
        const first = d.data?.[0];
        if (first) setN(first.price);
      })
      .catch(() => {});
  }, []);

  const v = n ?? fallback;
  return <>£{v}</>;
}
