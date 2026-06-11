"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppAuth } from "@/components/providers/AppAuthProvider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";

export default function LoginPage() {
  const { login } = useAppAuth();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setAuthError("");
    const result = await login(data.email, data.password);
    if (!result.ok) {
      setAuthError(result.error ?? "Invalid email or password. Please try again.");
    } else {
      const callbackUrl = searchParams.get("callbackUrl") || "/student/dashboard";
      window.location.href = callbackUrl;
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AutopilotLogo />
          </div>
          <h1 className="text-2xl font-bold text-brand-black">Welcome back</h1>
          <p className="text-brand-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <span>⚠</span> {authError}
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
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-brand-black">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-red hover:text-brand-orange">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-brand-muted hover:text-brand-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-brand-muted">
          New student?{" "}
          <Link href="/register" className="text-brand-red font-semibold hover:text-brand-orange">
            Register →
          </Link>
        </p>
      </div>
    </div>
  );
}
