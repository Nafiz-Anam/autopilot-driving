"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import axios from "axios";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";
import { backendApiUrl } from "@/lib/backend-api";
import { extractApiError } from "@/lib/api-errors";
import {
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  type ForgotPasswordInput,
  type ResetPasswordOtpInput,
  type ResetPasswordOtpFormInput,
} from "@/lib/validations/auth.schema";

type Stage = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const otpForm = useForm<ResetPasswordOtpFormInput, unknown, ResetPasswordOtpInput>({
    resolver: zodResolver(resetPasswordOtpSchema),
  });

  async function onEmailSubmit(data: ForgotPasswordInput) {
    setServerError("");
    try {
      await axios.post(backendApiUrl("/auth/forgot-password"), { email: data.email });
      setEmail(data.email);
      setStage("otp");
    } catch (err) {
      setServerError(extractApiError(err));
    }
  }

  async function onOtpSubmit(data: ResetPasswordOtpInput) {
    setServerError("");
    try {
      await axios.post(backendApiUrl("/auth/reset-password-otp"), {
        email,
        otp: data.otp,
        password: data.password,
      });
      setStage("done");
    } catch (err) {
      setServerError(extractApiError(err, "Invalid or expired code. Please try again."));
    }
  }

  async function onResend() {
    setResendMsg("");
    setServerError("");
    try {
      await axios.post(backendApiUrl("/auth/resend-password-reset"), { email });
      setResendMsg("New code sent. Check your inbox.");
    } catch (err) {
      setServerError(extractApiError(err, "Could not resend code. Please try again shortly."));
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AutopilotLogo />
          </div>
          {stage === "email" && (
            <>
              <h1 className="text-2xl font-bold text-brand-black">Forgot password?</h1>
              <p className="text-brand-muted text-sm mt-1">
                Enter your email and we&apos;ll send a 6-digit code.
              </p>
            </>
          )}
          {stage === "otp" && (
            <>
              <h1 className="text-2xl font-bold text-brand-black">Enter reset code</h1>
              <p className="text-brand-muted text-sm mt-1">
                We sent a 6-digit code to <strong>{email}</strong>.
              </p>
            </>
          )}
          {stage === "done" && (
            <>
              <h1 className="text-2xl font-bold text-brand-black">Password reset</h1>
              <p className="text-brand-muted text-sm mt-1">You can now sign in with your new password.</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <span>⚠</span> {serverError}
            </div>
          )}
          {resendMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              {resendMsg}
            </div>
          )}

          {stage === "email" && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-1">Email</label>
                <input
                  {...emailForm.register("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                  placeholder="you@example.com"
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
              >
                {emailForm.formState.isSubmitting ? "Sending…" : "Send code"}
              </button>
            </form>
          )}

          {stage === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-1">
                  6-digit code
                </label>
                <input
                  {...otpForm.register("otp")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm tracking-widest text-center"
                  placeholder="123456"
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-xs text-red-500 mt-1">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-black mb-1">
                  New password
                </label>
                <div className="relative">
                  <input
                    {...otpForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-brand-muted hover:text-brand-black"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {otpForm.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {otpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-black mb-1">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    {...otpForm.register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-brand-muted hover:text-brand-black"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {otpForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {otpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={otpForm.formState.isSubmitting}
                className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
              >
                {otpForm.formState.isSubmitting ? "Resetting…" : "Reset password"}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStage("email");
                    setServerError("");
                    setResendMsg("");
                  }}
                  className="text-brand-muted hover:text-brand-black"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  className="text-brand-red font-semibold hover:text-brand-orange"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {stage === "done" && (
            <div className="text-center">
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-brand-muted">
          <Link href="/login" className="text-brand-red font-semibold hover:text-brand-orange">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
