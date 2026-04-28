"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { registerSchema, type RegisterInput, type RegisterFormInput } from "@/lib/validations/auth.schema";

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setServerError("");
    try {
      const res = await axios.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
      });
      if (res.data.success) {
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          callbackUrl: "/student/dashboard",
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4 py-12">
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
          <h1 className="text-2xl font-bold text-brand-black">Create your account</h1>
          <p className="text-brand-muted text-sm mt-1">Join thousands of AutoPilot students</p>
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
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                placeholder="At least 8 characters"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-black mb-1">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
                placeholder="Repeat your password"
              />
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
