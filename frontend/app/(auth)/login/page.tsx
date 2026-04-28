"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setAuthError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
    } else {
      const callbackUrl = searchParams.get("callbackUrl") || "/student/dashboard";
      window.location.href = callbackUrl;
    }
  }

  async function handleGoogle() {
    await signIn("google", {
      callbackUrl: searchParams.get("callbackUrl") || "/student/dashboard",
    });
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#E8200A" />
              <path d="M10 24L18 12L26 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="21" r="3" fill="white" />
            </svg>
            <span className="text-xl font-extrabold text-brand-black" style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}>
              AutoPilot
            </span>
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

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-brand-border rounded-xl text-sm font-medium text-brand-black hover:bg-brand-surface transition-colors duration-200 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center text-xs text-brand-muted">
              <span className="bg-white px-3">or sign in with email</span>
            </div>
          </div>

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
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                placeholder="••••••••"
              />
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
