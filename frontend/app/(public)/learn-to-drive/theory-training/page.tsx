import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, BookOpen } from "lucide-react";

export const metadata = {
  title: "Theory Training | AutoPilot Driving School",
  description: "Interactive theory test practice for AutoPilot students.",
};

export default async function TheoryTrainingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/student/theory");
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Blurred Preview */}
        <div className="relative mb-8">
          <div className="bg-white rounded-2xl border border-brand-border p-6 blur-sm pointer-events-none select-none">
            <h3 className="text-xl font-bold text-brand-black mb-3">Theory Training Portal</h3>
            <div className="space-y-3">
              {["Road Signs & Markings — 70%", "Rules of the Road — 65%", "Vehicle Safety — 55%"].map((cat) => (
                <div key={cat}>
                  <p className="text-sm text-brand-muted mb-1">{cat}</p>
                  <div className="h-2 bg-brand-surface rounded-full">
                    <div className="h-2 bg-brand-red rounded-full w-3/4" />
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-brand-red/10 rounded-xl text-sm text-brand-red font-medium text-center">
                Start Practice Test →
              </div>
            </div>
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
            <div className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <p className="text-lg font-bold text-brand-black">Members Only</p>
            <p className="text-sm text-brand-muted mt-1">Log in or register to access theory training</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-brand-border p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}>
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-black mb-2" style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}>
            Theory Training
          </h1>
          <p className="text-brand-muted text-sm mb-6 leading-relaxed">
            Access hundreds of theory questions, mock tests, and hazard perception videos.
            Log in to track your progress and prepare for your DVSA theory test.
          </p>
          <div className="space-y-3">
            <Link
              href="/login?callbackUrl=/student/theory"
              className="block w-full px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 text-sm"
            >
              Log In to Access
            </Link>
            <Link
              href="/register"
              className="block w-full px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200 text-sm"
            >
              Create a Free Account
            </Link>
          </div>
          <p className="mt-4 text-xs text-brand-muted">
            Already a student? Your account includes full access to theory training.
          </p>
        </div>
      </div>
    </div>
  );
}
