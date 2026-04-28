"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, UserCheck, LogIn } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import { studentDetailsSchema, type StudentDetailsInput } from "@/lib/validations/booking.schema";
import { cn } from "@/lib/utils";

/* ── Shared field wrapper ──────────────────────────────────── */
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

/* ── Sign-in tab form ──────────────────────────────────────── */
function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" error={undefined}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          required
        />
      </Field>
      <Field label="Password" error={undefined}>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(inputClass, "pr-11")}
            placeholder="Your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign In & Continue"}
      </button>
    </form>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export function Step5StudentDetails() {
  const { data: session } = useSession();
  const { setStudentDetails, nextStep, prevStep } = useBookingStore();
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentDetailsInput>({
    resolver: zodResolver(studentDetailsSchema),
  });

  /* If already logged in, populate store and show green card */
  useEffect(() => {
    if (session?.user) {
      const parts = session.user.name?.split(" ") ?? [];
      setStudentDetails({
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
        email: session.user.email ?? "",
        phone: "",
        dateOfBirth: "",
      });
    }
  }, [session, setStudentDetails]);

  /* ── Already logged in ── */
  if (session?.user) {
    const initial = session.user.name?.charAt(0).toUpperCase() ?? "?";
    return (
      <div>
        <div className="mb-8">
          <h2
            className="text-2xl font-extrabold text-brand-black"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Continuing as {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-brand-muted mt-1 text-sm">
            You&apos;re already signed in.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5 mb-8"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-brand-black">{session.user.name}</p>
            <p className="text-sm text-brand-muted truncate">{session.user.email}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
        </motion.div>

        <div className="flex items-center gap-4">
          <button
            onClick={prevStep}
            className="px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
          >
            ← Back
          </button>
          <button
            onClick={nextStep}
            className="px-10 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  /* ── Guest flow ── */
  function onSubmit(data: StudentDetailsInput) {
    setStudentDetails({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      provisionalLicence: data.provisionalLicence,
    });
    nextStep();
  }

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Your details
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Create your AutoPilot account to manage bookings and track progress.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface rounded-2xl p-1 mb-8 w-full sm:w-auto sm:inline-flex">
        {(
          [
            { key: "new", label: "New Student", icon: UserCheck },
            { key: "existing", label: "I have an account", icon: LogIn },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 sm:flex-none flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              tab === key
                ? "bg-white text-brand-red shadow-sm"
                : "text-brand-muted hover:text-brand-black"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "existing" ? (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-md"
          >
            <SignInForm onSuccess={nextStep} />
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" error={errors.firstName?.message}>
                  <input
                    {...register("firstName")}
                    className={inputClass}
                    placeholder="Jane"
                  />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message}>
                  <input
                    {...register("lastName")}
                    className={inputClass}
                    placeholder="Smith"
                  />
                </Field>
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" error={errors.email?.message}>
                  <input
                    {...register("email")}
                    type="email"
                    className={inputClass}
                    placeholder="jane@example.com"
                  />
                </Field>
                <Field label="Phone (UK mobile)" error={errors.phone?.message}>
                  <input
                    {...register("phone")}
                    type="tel"
                    className={inputClass}
                    placeholder="07700 900000"
                  />
                </Field>
              </div>

              {/* DOB + Licence row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Provisional Licence No. (optional)"
                  error={errors.provisionalLicence?.message}
                >
                  <input
                    {...register("provisionalLicence")}
                    className={inputClass}
                    placeholder="e.g. SMITH901185JA9AB"
                    maxLength={18}
                  />
                </Field>
              </div>

              {/* Password */}
              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPw ? "text" : "password"}
                    className={cn(inputClass, "pr-11")}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password" error={errors.confirmPassword?.message}>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPw ? "text" : "password"}
                    className={cn(inputClass, "pr-11")}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register("termsAccepted")}
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-brand-border accent-brand-red cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-brand-muted leading-relaxed">
                    I agree to the{" "}
                    <a href="/terms" className="text-brand-red hover:underline font-medium">
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-brand-red hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <AnimatePresence>
                  {errors.termsAccepted && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500 mt-1"
                    >
                      {errors.termsAccepted.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving…" : "Continue →"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
