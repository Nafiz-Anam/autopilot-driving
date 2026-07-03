"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import axios from "axios";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";
import { backendApiUrl } from "@/lib/backend-api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth.schema";

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError("");
    try {
      await axios.post(backendApiUrl("/auth/forgot-password"), { email: data.email });
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AutopilotLogo />
          </div>
          <h1 className="text-2xl font-bold text-brand-black">Forgot password?</h1>
          <p className="text-brand-muted text-sm mt-1">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                If an account exists for <strong>{getValues("email")}</strong>, a password reset link
                has been sent. Check your inbox and spam folder.
              </div>
              <Link
                href="/login"
                className="inline-block text-sm text-brand-red font-semibold hover:text-brand-orange"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <span>⚠</span> {serverError}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">Email</label>
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-brand-muted">
          Remembered it?{" "}
          <Link href="/login" className="text-brand-red font-semibold hover:text-brand-orange">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
