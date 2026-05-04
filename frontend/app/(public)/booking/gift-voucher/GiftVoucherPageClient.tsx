"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Star, CheckCircle2, Loader2, Copy, Check, Lock, XCircle, ArrowLeft } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { giftVoucherSchema, type GiftVoucherInput } from "@/lib/validations/giftVoucher.schema";
import { cn } from "@/lib/utils";

const CONFETTI_COLORS = ["#E8200A", "#FF5500", "#FFB800", "#00C853", "#2979FF", "#AA00FF"];

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 1.2,
    duration: 2.2 + Math.random() * 1.4,
    size: 6 + Math.floor(Math.random() * 7),
    rotate: Math.random() * 360,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            rotate: p.rotate,
          }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate + 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

function VoucherPreview({
  amount,
  recipientName,
  senderName,
  message,
}: {
  amount: number;
  recipientName: string;
  senderName: string;
  message: string;
}) {
  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-2xl shadow-xl"
      style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 50%, #E8200A 100%)" }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-orange/20 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-brand-red/30 blur-2xl" />
      <div className="relative p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
            >
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-white font-extrabold text-sm tracking-wider"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              AUTOPILOT
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Gift Value</p>
          <p
            className="text-5xl font-extrabold text-white leading-none"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            £{amount || 0}
          </p>
        </div>
        {recipientName && (
          <div className="mb-3">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">For</p>
            <p className="text-white font-bold text-lg">{recipientName}</p>
          </div>
        )}
        {message && (
          <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
            <p className="text-white/80 text-xs italic leading-relaxed">&ldquo;{message}&rdquo;</p>
          </div>
        )}
        {senderName && (
          <p className="text-white/60 text-xs">
            With love from <span className="text-white font-semibold">{senderName}</span>
          </p>
        )}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/40 text-xs">autopilotdriving.co.uk</p>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessState({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-16 relative">
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-white rounded-2xl border border-brand-border shadow-lg p-10 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
        >
          <Gift className="w-10 h-10 text-white" />
        </motion.div>
        <h2
          className="text-3xl font-extrabold text-brand-black mb-2"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Payment complete
        </h2>
        <p className="text-brand-muted text-sm mb-8">
          Your gift voucher is ready. Share the code below with the recipient.
        </p>
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-2">
            Voucher Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <p
              className="text-3xl font-extrabold text-brand-red tracking-[0.2em]"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              {code}
            </p>
            <button
              type="button"
              onClick={copy}
              className="p-2 rounded-lg border border-brand-border hover:border-brand-red hover:text-brand-red transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-brand-muted leading-relaxed">
          Redeem this code when booking a lesson or package. Valid for 12 months from purchase.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 w-full py-3 border-2 border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
        >
          Buy another voucher
        </button>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-black mb-1.5">{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function GiftPayForm({
  amount,
  onPaid,
  onBack,
}: {
  amount: number;
  onPaid: (code: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/gift-voucher`,
      },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? "Payment failed.");
      setLoading(false);
      return;
    }
    const piId = paymentIntent?.id;
    if (!piId) {
      setError("Could not verify payment.");
      setLoading(false);
      return;
    }
    let code = "";
    try {
      const { data } = await axios.post("/api/gift-vouchers/confirm", { paymentIntentId: piId });
      if (data.success && data.data?.code) code = data.data.code;
    } catch {
      /* webhook may complete first; parent falls back to payCtx.code */
    }
    onPaid(code);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
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
        className="w-full py-4 bg-brand-red text-white rounded-full font-bold text-base hover:bg-brand-orange disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay £{amount}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 border border-brand-border rounded-full text-sm font-semibold text-brand-black hover:border-brand-red flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to details
      </button>
    </form>
  );
}

const inputClass =
  "w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm transition-shadow";

const PRESET_AMOUNTS = [42, 100, 200];

export default function GiftVoucherPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<"form" | "pay" | "success">("form");
  const [amount, setAmount] = useState(42);
  const [customInput, setCustomInput] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [formError, setFormError] = useState("");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [payCtx, setPayCtx] = useState<{
    clientSecret: string;
    code: string;
    paymentIntentId: string;
    amount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GiftVoucherInput>({
    resolver: zodResolver(giftVoucherSchema),
    defaultValues: { amount: 42 },
  });

  const watchedValues = watch();
  const finalAmount = useCustom ? parseFloat(customInput) || 0 : amount;

  useEffect(() => {
    fetch("/api/stripe/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.publishableKey) setStripePromise(loadStripe(d.publishableKey));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pi = searchParams.get("payment_intent");
    if (!pi) return;

    (async () => {
      try {
        const { data } = await axios.post("/api/gift-vouchers/confirm", { paymentIntentId: pi });
        if (data.success && data.data?.code) {
          setVoucherCode(data.data.code);
          setPhase("success");
        }
      } catch {
        setFormError("Could not verify payment after authentication. Contact support with your receipt.");
      } finally {
        router.replace("/booking/gift-voucher", { scroll: false });
      }
    })();
  }, [searchParams, router]);

  async function onSubmit(data: GiftVoucherInput) {
    if (!finalAmount || finalAmount < 10) return;
    setFormError("");
    try {
      const res = await axios.post("/api/gift-vouchers", {
        ...data,
        amount: finalAmount,
      });
      if (res.data.success && res.data.data?.clientSecret) {
        setPayCtx({
          clientSecret: res.data.data.clientSecret,
          code: res.data.data.code,
          paymentIntentId: res.data.data.paymentIntentId,
          amount: finalAmount,
        });
        setPhase("pay");
      } else {
        setFormError(res.data.error ?? "Could not start payment.");
      }
    } catch {
      setFormError("Could not start payment. Please try again.");
    }
  }

  function afterInlinePay(code: string) {
    setVoucherCode(code || payCtx?.code || "");
    setPhase("success");
  }

  if (phase === "success") {
    return <SuccessState code={voucherCode || "—"} />;
  }

  if (phase === "pay" && payCtx && stripePromise) {
    return (
      <div className="min-h-screen bg-brand-surface py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
            <h2 className="font-bold text-brand-black text-lg mb-2">Card payment</h2>
            <p className="text-sm text-brand-muted mb-6">
              Pay £{payCtx.amount} securely. Your voucher code will be confirmed after payment succeeds.
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: payCtx.clientSecret,
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
              <GiftPayForm
                amount={payCtx.amount}
                onPaid={afterInlinePay}
                onBack={() => {
                  setPhase("form");
                  setPayCtx(null);
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-red/20"
            style={{ background: "linear-gradient(135deg, #FF5500 0%, #E8200A 100%)" }}
          >
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1
            className="text-4xl font-extrabold text-brand-black mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Give the Gift of Driving
          </h1>
          <p className="text-brand-muted text-lg max-w-md mx-auto leading-relaxed">
            Treat someone to the freedom of the open road. They can redeem it on any lesson or package.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-brand-border shadow-sm p-8"
          >
            <h2 className="font-bold text-brand-black text-lg mb-6">Voucher details</h2>

            {formError && (
              <div className="mb-4 flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-3">Choose amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAmount(a);
                        setUseCustom(false);
                      }}
                      className={cn(
                        "py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150",
                        !useCustom && amount === a
                          ? "border-brand-red bg-red-50 text-brand-red"
                          : "border-brand-border text-brand-muted hover:border-brand-red/60 hover:text-brand-black"
                      )}
                    >
                      £{a}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseCustom(true)}
                    className={cn(
                      "py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150",
                      useCustom
                        ? "border-brand-red bg-red-50 text-brand-red"
                        : "border-brand-border text-brand-muted hover:border-brand-red/60 hover:text-brand-black"
                    )}
                  >
                    Other
                  </button>
                </div>
                <AnimatePresence>
                  {useCustom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-brand-black font-bold text-lg">£</span>
                      <input
                        type="number"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        min={10}
                        placeholder="Enter amount (min £10)"
                        className={inputClass}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Recipient name" error={errors.recipientName?.message}>
                  <input {...register("recipientName")} className={inputClass} placeholder="Jane Smith" />
                </Field>
                <Field label="Recipient email" error={errors.recipientEmail?.message}>
                  <input
                    {...register("recipientEmail")}
                    type="email"
                    className={inputClass}
                    placeholder="jane@example.com"
                  />
                </Field>
              </div>

              <Field label="From (your name)" error={errors.senderName?.message}>
                <input {...register("senderName")} className={inputClass} placeholder="Your name" />
              </Field>

              <Field label="Personal message (optional)" error={errors.message?.message}>
                <div className="relative">
                  <textarea
                    {...register("message", {
                      onChange: (e) => setCharCount(e.target.value.length),
                    })}
                    rows={3}
                    maxLength={200}
                    className={cn(inputClass, "resize-none")}
                    placeholder="Happy birthday…"
                  />
                  <span
                    className={cn(
                      "absolute bottom-2 right-3 text-xs",
                      charCount > 180 ? "text-amber-500" : "text-brand-muted"
                    )}
                  >
                    {charCount}/200
                  </span>
                </div>
              </Field>

              <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                <p className="text-sm font-semibold text-brand-black mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Secure payment
                </p>
                <p className="text-xs text-brand-muted">
                  Next step: pay with card via Stripe. Your voucher is issued only after payment succeeds.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting || (useCustom && (!customInput || parseFloat(customInput) < 10)) || !stripePromise
                }
                className="w-full py-4 bg-brand-red text-white rounded-full font-bold text-base hover:bg-brand-orange active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting checkout…
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Continue to pay £{finalAmount || "—"}
                  </>
                )}
              </button>

              {!stripePromise && (
                <p className="text-center text-xs text-amber-600">
                  Payment gateway is loading… If this persists, Stripe keys may be missing.
                </p>
              )}

              <p className="text-center text-xs text-brand-muted flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> SSL encrypted · Powered by Stripe
              </p>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:sticky lg:top-8"
          >
            <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Live preview</p>
            <VoucherPreview
              amount={finalAmount}
              recipientName={watchedValues.recipientName ?? ""}
              senderName={watchedValues.senderName ?? ""}
              message={watchedValues.message ?? ""}
            />
            <div className="mt-6 space-y-3">
              {[
                "Redeemable on any lesson or package",
                "Valid for 12 months from purchase",
                "Secure checkout with instant code after payment",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3 text-sm text-brand-muted">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
