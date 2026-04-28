"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Gift, Star, CheckCircle2, Loader2, Copy, Check } from "lucide-react";
import { giftVoucherSchema, type GiftVoucherInput } from "@/lib/validations/giftVoucher.schema";
import { cn } from "@/lib/utils";

/* ── Confetti (reused pattern) ─────────────────────────────── */
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

/* ── Voucher preview card ───────────────────────────────────── */
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
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-orange/20 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-brand-red/30 blur-2xl" />

      <div className="relative p-7">
        {/* Top row */}
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

        {/* Amount */}
        <div className="mb-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Gift Value</p>
          <p
            className="text-5xl font-extrabold text-white leading-none"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            £{amount || 0}
          </p>
        </div>

        {/* Recipient */}
        {recipientName && (
          <div className="mb-3">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">For</p>
            <p className="text-white font-bold text-lg">{recipientName}</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
            <p className="text-white/80 text-xs italic leading-relaxed">
              &ldquo;{message}&rdquo;
            </p>
          </div>
        )}

        {/* Sender */}
        {senderName && (
          <p className="text-white/60 text-xs">
            With love from{" "}
            <span className="text-white font-semibold">{senderName}</span>
          </p>
        )}

        {/* Bottom strip */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/40 text-xs">autopilotdriving.co.uk</p>
          <div className="flex gap-1">
            {["●●●●", "●●●●", "APS-"].map((chunk, i) => (
              <span key={i} className="text-white/30 text-xs tracking-widest">
                {chunk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Success state ──────────────────────────────────────────── */
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
          Voucher Sent! 🎉
        </h2>
        <p className="text-brand-muted text-sm mb-8">
          The recipient will receive their gift voucher by email shortly.
        </p>

        {/* Code display */}
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
              onClick={copy}
              className="p-2 rounded-lg border border-brand-border hover:border-brand-red hover:text-brand-red transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-brand-muted leading-relaxed">
          This code can be used at checkout to redeem the full gift voucher value
          against any AutoPilot lesson or package.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 w-full py-3 border-2 border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
        >
          Buy Another Voucher
        </button>
      </motion.div>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────────── */
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

const inputClass =
  "w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm transition-shadow";

const PRESET_AMOUNTS = [42, 100, 200];

/* ── Page ───────────────────────────────────────────────────── */
export default function GiftVoucherPage() {
  const [amount, setAmount] = useState<number>(42);
  const [customInput, setCustomInput] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [charCount, setCharCount] = useState(0);

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

  async function onSubmit(data: GiftVoucherInput) {
    if (!finalAmount || finalAmount < 10) return;
    try {
      const res = await axios.post("/api/gift-vouchers", {
        ...data,
        amount: finalAmount,
      });
      if (res.data.success) {
        setVoucherCode(res.data.data.code);
        setSuccess(true);
      }
    } catch {
      // silently handled — production would show a toast
    }
  }

  if (success) {
    return <SuccessState code={voucherCode} />;
  }

  return (
    <div className="min-h-screen bg-brand-surface py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
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
            Treat someone to the freedom of the open road. They can redeem it
            on any lesson or package.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Form ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-brand-border shadow-sm p-8"
          >
            <h2 className="font-bold text-brand-black text-lg mb-6">Voucher Details</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Amount selection */}
              <div>
                <label className="block text-sm font-medium text-brand-black mb-3">
                  Choose Amount
                </label>
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

              {/* Recipient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Recipient Name" error={errors.recipientName?.message}>
                  <input
                    {...register("recipientName")}
                    className={inputClass}
                    placeholder="Jane Smith"
                  />
                </Field>
                <Field label="Recipient Email" error={errors.recipientEmail?.message}>
                  <input
                    {...register("recipientEmail")}
                    type="email"
                    className={inputClass}
                    placeholder="jane@example.com"
                  />
                </Field>
              </div>

              {/* Sender */}
              <Field label="From (Your Name)" error={errors.senderName?.message}>
                <input
                  {...register("senderName")}
                  className={inputClass}
                  placeholder="Your name"
                />
              </Field>

              {/* Message */}
              <Field label="Personal Message (optional)" error={errors.message?.message}>
                <div className="relative">
                  <textarea
                    {...register("message", {
                      onChange: (e) => setCharCount(e.target.value.length),
                    })}
                    rows={3}
                    maxLength={200}
                    className={cn(inputClass, "resize-none")}
                    placeholder="Happy birthday! Here's something to help you get your licence…"
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

              {/* Payment placeholder */}
              <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
                <p className="text-sm font-semibold text-brand-black mb-1 flex items-center gap-2">
                  <span>💳</span> Secure Payment
                </p>
                <p className="text-xs text-brand-muted">
                  Payment will be collected securely via Stripe. Your card details are
                  never stored on our servers.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || (useCustom && (!customInput || parseFloat(customInput) < 10))}
                className="w-full py-4 bg-brand-red text-white rounded-full font-bold text-base hover:bg-brand-orange active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-red/25 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Purchase £{finalAmount || "—"} Gift Voucher
                  </>
                )}
              </button>

              <p className="text-center text-xs text-brand-muted">
                🔒 Secure payment via Stripe. SSL encrypted.
              </p>
            </form>
          </motion.div>

          {/* ── Live preview ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:sticky lg:top-8"
          >
            <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">
              Live Preview
            </p>
            <VoucherPreview
              amount={finalAmount}
              recipientName={watchedValues.recipientName ?? ""}
              senderName={watchedValues.senderName ?? ""}
              message={watchedValues.message ?? ""}
            />

            {/* Feature list */}
            <div className="mt-6 space-y-3">
              {[
                "Recipient receives a beautifully designed email",
                "Redeemable on any lesson or package",
                "Valid for 12 months from purchase",
                "Fully refundable if unused",
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
