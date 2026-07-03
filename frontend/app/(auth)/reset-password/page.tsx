"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";
import { backendApiUrl } from "@/lib/backend-api";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  type ResetPasswordFormInput,
} from "@/lib/validations/auth.schema";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput, unknown, ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordInput) {
    setServerError("");
    try {
      await axios.post(
        backendApiUrl(`/auth/reset-password?token=${encodeURIComponent(token)}`),
        { password: data.password }
      );
      setDone(true);
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
          <h1 className="text-2xl font-bold text-brand-black">Reset password</h1>
          <p className="text-brand-muted text-sm mt-1">Choose a new password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
          {!token ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              Missing or invalid reset link. Please request a new one from{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                Forgot password
              </Link>
              .
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                Password reset successful. You can now sign in with your new password.
              </div>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200"
              >
                Sign in
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
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
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
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-black mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirmPassword")}
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
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </>
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
