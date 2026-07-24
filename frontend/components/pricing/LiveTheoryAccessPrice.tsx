"use client";

import { useEffect, useState } from "react";
import { backendApiUrl } from "@/lib/backend-api";

type State =
  | { status: "loading" }
  | { status: "loaded"; price: number }
  | { status: "error" };

export function LiveTheoryAccessPrice() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(backendApiUrl("/pricing/theory-price"), { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: { price: number } }) => {
        if (cancelled) return;
        if (d.success && d.data?.price != null) {
          setState({ status: "loaded", price: d.data.price });
        } else {
          setState({ status: "error" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <span className="inline-block h-[1em] w-20 bg-brand-border/60 rounded animate-pulse align-middle" />
    );
  }

  if (state.status === "error") {
    return <span className="text-base font-semibold text-brand-muted">Price on request</span>;
  }

  const { price } = state;
  return <>£{Number.isInteger(price) ? price : price.toFixed(2)}</>;
}
