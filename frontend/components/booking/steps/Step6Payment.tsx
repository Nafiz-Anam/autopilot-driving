"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { Tag, Lock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

/* ── Inner payment form (inside <Elements>) ─────────────────── */
function PaymentForm({
  total,
  onSuccess,
}: {
  total: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking?step=7`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
        >
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </motion.div>
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
            Confirm &amp; Pay £{Math.max(0, total)}
          </>
        )}
      </button>

      <p className="text-center text-xs text-brand-muted mt-3 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        Secure payment via Stripe. SSL encrypted.
      </p>
    </form>
  );
}

/* ── Promo code section ─────────────────────────────────────── */
function PromoInput() {
  const {
    selectedPackage,
    promoCode,
    promoDiscount,
    setPromoCode,
    setPromoDiscount,
  } = useBookingStore();
  const [input, setInput] = useState(promoCode ?? "");
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState("");
  const [valid, setValid] = useState(promoDiscount > 0);

  async function apply() {
    if (!input.trim()) return;
    setApplying(true);
    setMsg("");
    try {
      const { data } = await axios.post("/api/gift-vouchers/validate", {
        code: input.trim(),
        amount: selectedPackage?.price,
      });
      if (data.success && data.data.valid) {
        setPromoCode(input.trim());
        setPromoDiscount(data.data.discount);
        setMsg(`Voucher applied — saving £${data.data.discount}!`);
        setValid(true);
      } else {
        setMsg(data.data?.reason ?? "Invalid or expired voucher code.");
        setValid(false);
      }
    } catch {
      setMsg("Could not validate voucher. Please try again.");
      setValid(false);
    } finally {
      setApplying(false);
    }
  }

  function remove() {
    setPromoCode("");
    setPromoDiscount(0);
    setInput("");
    setMsg("");
    setValid(false);
  }

  return (
    <div className="mb-6">
      <label className="flex items-center gap-1.5 text-sm font-medium text-brand-black mb-2">
        <Tag className="w-4 h-4 text-brand-muted" />
        Gift Voucher / Promo Code
      </label>

      {valid ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            {msg}
          </span>
          <button
            onClick={remove}
            className="text-xs text-green-600 hover:text-red-600 underline transition-colors"
          >
            Remove
          </button>
        </motion.div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm uppercase tracking-widest"
              placeholder="Enter code…"
              maxLength={12}
            />
            <button
              type="button"
              onClick={apply}
              disabled={!input.trim() || applying}
              className="px-5 py-2.5 bg-brand-black text-white rounded-xl text-sm font-semibold hover:bg-brand-red transition-colors duration-200 disabled:opacity-50"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>
          {msg && !valid && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 mt-1.5"
            >
              {msg}
            </motion.p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main Step6Payment ──────────────────────────────────────── */
export function Step6Payment() {
  const {
    selectedPackage,
    selectedInstructor,
    selectedDate,
    selectedSlot,
    lessonType,
    transmission,
    promoCode,
    promoDiscount,
    setPaymentIntentId,
    nextStep,
    prevStep,
  } = useBookingStore();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [initError, setInitError] = useState("");

  const total = Math.max(0, (selectedPackage?.price ?? 0) - promoDiscount);

  useEffect(() => {
    if (selectedPackage && selectedInstructor && selectedDate && selectedSlot && lessonType) {
      initPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initPayment() {
    setLoadingIntent(true);
    setInitError("");
    try {
      const scheduledAt = new Date(selectedDate!);
      const [h, m] = selectedSlot!.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const bookingRes = await axios.post("/api/bookings", {
        lessonType,
        transmission: transmission ?? "manual",
        instructorId: selectedInstructor!.id,
        packageId: selectedPackage!.id,
        scheduledAt: scheduledAt.toISOString(),
        durationMins: 60,
        totalAmount: selectedPackage!.price,
        voucherCode: promoCode ?? undefined,
      });

      if (!bookingRes.data.success) {
        setInitError("Could not create booking. Please go back and try again.");
        return;
      }

      const bId: string = bookingRes.data.data.id;

      const piRes = await axios.post("/api/payments", {
        bookingId: bId,
        voucherCode: promoCode,
      });

      if (piRes.data.success && piRes.data.data.clientSecret) {
        setClientSecret(piRes.data.data.clientSecret);
        setPaymentIntentId(piRes.data.data.clientSecret);
      } else if (piRes.data.data?.fullyDiscounted) {
        nextStep();
      }
    } catch {
      setInitError("Something went wrong. Please go back and try again.");
    } finally {
      setLoadingIntent(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Payment
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Secure payment powered by Stripe. Your card details are never stored.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
        {/* ── Left: payment form ── */}
        <div>
          <PromoInput />

          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
            {loadingIntent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
                <p className="text-sm text-brand-muted">Setting up secure payment…</p>
              </div>
            ) : initError ? (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {initError}
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#E8200A",
                      borderRadius: "12px",
                      fontFamily: "Barlow, system-ui, sans-serif",
                    },
                  },
                }}
              >
                <PaymentForm total={total} onSuccess={nextStep} />
              </Elements>
            ) : (
              <p className="text-brand-muted text-sm text-center py-8">
                Initialising payment…
              </p>
            )}
          </div>

          <button
            onClick={prevStep}
            className={cn(
              "mt-5 px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm",
              "hover:border-brand-red hover:text-brand-red transition-colors duration-200"
            )}
          >
            ← Back
          </button>
        </div>

        {/* ── Right: sticky summary ── */}
        <div>
          <BookingSummary />
        </div>
      </div>
    </div>
  );
}
