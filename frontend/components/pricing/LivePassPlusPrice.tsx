"use client";

import { useEffect, useState } from "react";

export function LivePassPlusPrice({ fallback = 260 }: { fallback?: number }) {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/pricing/packages?lessonType=PASS_PLUS", { cache: "no-store" })
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
