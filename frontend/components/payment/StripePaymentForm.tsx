"use client";

import { useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, Loader2, XCircle } from "lucide-react";

interface StripePaymentFormProps {
  amount: number;
  buttonLabel?: string;
  returnUrl: string;
  onConfirmed: (paymentIntentId: string) => Promise<void> | void;
  onCancel?: () => void;
  cancelLabel?: string;
  footnote?: React.ReactNode;
}

export function StripePaymentForm({
  amount,
  buttonLabel = "Confirm & Pay",
  returnUrl,
  onConfirmed,
  onCancel,
  cancelLabel = "Back",
  footnote,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasWallets, setHasWallets] = useState(false);

  async function confirmPayment() {
    if (!stripe || !elements) return false;
    setError("");

    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (err) {
      setError(err.message ?? "Payment failed. Please try again.");
      return false;
    }

    const piId = paymentIntent?.id;
    if (!piId) {
      setError("Could not confirm payment. Please try again.");
      return false;
    }

    await onConfirmed(piId);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (!(await confirmPayment())) setLoading(false);
  }

  async function handleExpressConfirm() {
    setLoading(true);
    if (!(await confirmPayment())) setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        onReady={({ availablePaymentMethods }) =>
          setHasWallets(availablePaymentMethods != null)
        }
        options={{ buttonHeight: 52 }}
      />

      {hasWallets && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <span className="text-xs text-brand-muted">or pay by card</span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>
      )}

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-brand-red text-white rounded-full font-bold text-base hover:bg-brand-orange active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {buttonLabel} £{Math.max(0, amount)}
          </>
        )}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 border border-brand-border rounded-full text-sm font-semibold text-brand-black hover:border-brand-red flex items-center justify-center gap-2"
        >
          {cancelLabel}
        </button>
      )}

      {footnote}
    </form>
  );
}
