"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppAuth } from "@/components/providers/AppAuthProvider";
import Link from "next/link";
import axios from "axios";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";
import { backendApiUrl } from "@/lib/backend-api";
import { registerSchema, type RegisterInput, type RegisterFormInput } from "@/lib/validations/auth.schema";

export default function RegisterPage() {
  const { login } = useAppAuth();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError("");
    try {
      const res = await axios.post(backendApiUrl("/public/register"), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
      });
      if (res.data.success) {
        if (res.data.data?.role === "PENDING_INSTRUCTOR") {
          setPendingApproval(true);
          return;
        }
        const signedIn = await login(data.email, data.password);
        if (signedIn.ok) {
          window.location.href = "/student/dashboard";
        } else {
          setServerError(signedIn.error ?? "Account created. Please sign in.");
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex mb-6">
            <AutopilotLogo />
          </div>
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-black mb-2">Application submitted!</h2>
            <p className="text-brand-muted text-sm mb-6">
              Your instructor account is pending review. We&apos;ll email you once our team has approved your application.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <AutopilotLogo />
          </div>
          <h1 className="text-2xl font-bold text-brand-black">Create your account</h1>
          <p className="text-brand-muted text-sm mt-1">Join thousands of Autopilot students</p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1">Full Name</label>
              <input
                {...register("name")}
                autoComplete="name"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                placeholder="Jane Smith"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
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
              <label className="block text-sm font-medium text-brand-black mb-1">Phone (UK mobile)</label>
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                placeholder="07700 900000"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-11 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1">I am a…</label>
              <select
                {...register("role")}
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm bg-white"
              >
                <option value="STUDENT">Student — I want to learn to drive</option>
                <option value="INSTRUCTOR">Becoming an Instructor — I want to teach</option>
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-2.5 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-brand-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-red font-semibold hover:text-brand-orange">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
