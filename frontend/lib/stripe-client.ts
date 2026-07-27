"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { backendApiUrl } from "@/lib/backend-api";

export const STRIPE_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#E8200A",
    borderRadius: "12px",
    fontFamily: "Barlow, system-ui, sans-serif",
  },
};

let cachedStripePromise: Promise<Stripe | null> | null = null;

export function useStripePromise(): Promise<Stripe | null> | null {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    () => cachedStripePromise
  );

  useEffect(() => {
    if (cachedStripePromise) return;
    fetch(backendApiUrl("/site/stripe/config"))
      .then((r) => r.json())
      .then((d) => {
        if (d.publishableKey) {
          cachedStripePromise = loadStripe(d.publishableKey);
          setStripePromise(cachedStripePromise);
        }
      })
      .catch(() => {});
  }, []);

  return stripePromise;
}
