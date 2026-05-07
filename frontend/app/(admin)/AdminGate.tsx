"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/components/providers/AppAuthProvider";
import AdminShell from "./_components/AdminShell";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=" + encodeURIComponent("/admin/dashboard"));
    }
    if (status === "authenticated" && data?.user?.role !== "ADMIN") {
      router.replace("/student/dashboard");
    }
  }, [status, data, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-muted">Loading admin…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !data?.user || data.user.role !== "ADMIN") {
    return null;
  }

  return (
    <AdminShell user={{ name: data.user.name ?? "Admin", email: data.user.email }}>
      {children}
    </AdminShell>
  );
}
