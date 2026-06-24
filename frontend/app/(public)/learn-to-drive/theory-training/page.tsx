"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, BookOpen } from "lucide-react";
import { LiveTheoryAccessPrice } from "@/components/pricing/LiveTheoryAccessPrice";
import { useAppSession } from "@/components/providers/AppAuthProvider";

export default function TheoryTrainingPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace("/student/theory");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
        <div className="w-10 h-10 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl border border-brand-border p-8 text-center mb-6">
          <Lock className="w-12 h-12 text-brand-red mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-brand-black mb-2">Theory Training</h2>
          <p className="text-brand-muted text-sm mb-6 max-w-sm mx-auto">
            Full interactive theory practice is included with your AutoPilot account. Sign in to track progress across all DVSA categories.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/student/theory"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Sign in to unlock
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-brand-border rounded-full font-semibold text-brand-black hover:bg-brand-surface transition-colors"
            >
              Create account
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-brand-border">
            <p className="text-xs text-brand-muted mb-1">Theory-only access</p>
            <LiveTheoryAccessPrice />
          </div>
        </div>
        <p className="text-center text-sm text-brand-muted">
          <Link href="/learn-to-drive" className="text-brand-red hover:text-brand-orange font-medium">
            ← Back to Learn to Drive
          </Link>
        </p>
      </div>
    </div>
  );
}
