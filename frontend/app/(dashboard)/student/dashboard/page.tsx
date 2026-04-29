"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Trophy,
  BookOpen,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING";

interface ApiStats {
  lessonsCompleted: number;
  hoursTotal: number;
  theoryScore: number;
  nextLesson: {
    scheduledAt: string;
    instructorName: string;
    lessonType: string;
  } | null;
}

interface ApiBooking {
  id: string;
  scheduledAt: string;
  instructorName: string;
  lessonType: string;
  status: BookingStatus;
  durationMins: number;
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  CONFIRMED: {
    label: "Confirmed",
    classes: "bg-green-100 text-green-700 border border-green-200",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-gray-100 text-brand-muted border border-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-red-50 text-brand-red border border-red-100",
  },
  PENDING: {
    label: "Pending",
    classes: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
};

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLessonType(type: string) {
  const map: Record<string, string> = {
    MANUAL: "Manual Lesson",
    AUTOMATIC: "Auto Lesson",
    INTENSIVE: "Intensive Course",
    REFRESHER: "Refresher",
    PASS_PLUS: "Pass Plus",
    THEORY: "Theory",
  };
  return map[type] ?? type;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatScheduledAt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendLabel: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex flex-col gap-3"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          accent
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-brand-black leading-none mb-1">
          {value}
        </p>
        <p className="text-sm text-brand-muted">{label}</p>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-semibold",
          trend === "up"
            ? "text-green-600"
            : trend === "down"
            ? "text-brand-red"
            : "text-brand-muted"
        )}
      >
        {trend === "up" ? (
          <TrendingUp className="w-3 h-3" />
        ) : trend === "down" ? (
          <TrendingDown className="w-3 h-3" />
        ) : null}
        {trendLabel}
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const [stats, setStats] = useState<ApiStats | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          fetch("/api/student/stats"),
          fetch("/api/bookings"),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(Array.isArray(data) ? data : data.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-64" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const lessonsCompleted = stats?.lessonsCompleted ?? 0;
  const hoursTotal = stats?.hoursTotal ?? 0;
  const theoryScore = stats?.theoryScore ?? 0;
  const nextLesson = stats?.nextLesson ?? null;
  const progressPct = Math.min(100, Math.round((lessonsCompleted / 45) * 100));
  const recentBookings = bookings.slice(-5).reverse();

  return (
    <motion.div
      className=""
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-brand-muted mt-1 text-sm">{formatDate()}</p>
      </motion.div>

      {/* ── Next Lesson card ── */}
      {nextLesson ? (
        <motion.div
          variants={itemVariants}
          className="bg-brand-black text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/4 pointer-events-none" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-brand-red/20 pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-red-900/40">
              {nextLesson.instructorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                Your Next Lesson
              </p>
              <h3 className="text-xl font-bold leading-tight">
                {formatScheduledAt(nextLesson.scheduledAt)}
              </h3>
              <p className="text-white/65 text-sm mt-1">
                {formatTime(nextLesson.scheduledAt)} &middot;{" "}
                {formatLessonType(nextLesson.lessonType)} &middot;{" "}
                {nextLesson.instructorName}
              </p>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 relative z-10">
            <div className="text-right">
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-0.5">
                Coming up in
              </p>
              <p className="text-3xl font-extrabold text-brand-orange leading-none">
                {daysUntil(nextLesson.scheduledAt)} days
              </p>
            </div>
            <Link
              href="/student/bookings"
              className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 border border-white/10"
            >
              View Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="bg-brand-black text-white rounded-2xl p-6 mb-8 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/4 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Your Next Lesson</p>
              <h3 className="text-xl font-bold">No upcoming lessons</h3>
              <p className="text-white/65 text-sm mt-1">Book a lesson to get started</p>
            </div>
            <Link href="/booking" className="ml-auto relative z-10 shrink-0 px-5 py-2.5 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors">Book Now</Link>
          </div>
        </motion.div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="Lessons Completed"
          value={String(lessonsCompleted)}
          trend="up"
          trendLabel="+1 this week"
          accent="bg-brand-red"
        />
        <StatCard
          icon={Clock}
          label="Hours Driven"
          value={`${hoursTotal.toFixed(1)} hrs`}
          trend="up"
          trendLabel="+1 hr this week"
          accent="bg-brand-orange"
        />
        <StatCard
          icon={Trophy}
          label="Theory Score"
          value={`${theoryScore}%`}
          trend="up"
          trendLabel="+4% since last test"
          accent="bg-purple-500"
        />
      </div>

      {/* ── Progress card ── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-red" />
            <h3 className="font-bold text-brand-black text-sm">
              Overall Driving Proficiency
            </h3>
          </div>
          <span className="text-xl font-extrabold text-brand-red">{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-brand-surface rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-linear-to-r from-brand-red to-brand-orange rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-brand-muted">
          <span>{lessonsCompleted} of ~45 lessons completed</span>
          <span>
            Est. pass readiness:{" "}
            <strong className="text-brand-black">
              {progressPct >= 75 ? "High" : progressPct >= 50 ? "Medium" : "Low"}
            </strong>
          </span>
        </div>
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        variants={itemVariants}
        className="bg-brand-red text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/8 pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-1">Book Your Next Lesson</h3>
          <p className="text-white/75 text-sm">
            Keep the momentum — consistency is key to passing.
          </p>
        </div>
        <Link
          href="/booking"
          className="relative z-10 shrink-0 px-6 py-2.5 bg-white text-brand-red rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 shadow-md"
        >
          Book Now <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* ── Recent Bookings ── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-bold text-brand-black flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-brand-red" />
            Recent Bookings
          </h3>
          <Link
            href="/student/bookings"
            className="text-xs text-brand-red hover:text-brand-orange font-semibold transition-colors"
          >
            View all &rarr;
          </Link>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_1fr_auto] gap-4 px-6 py-2.5 bg-brand-surface border-b border-brand-border">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Date &amp; Time
          </span>
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Instructor
          </span>
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Type
          </span>
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Status
          </span>
        </div>

        <div className="divide-y divide-brand-border">
          {recentBookings.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-brand-muted">
              No bookings yet.{" "}
              <Link href="/booking" className="text-brand-red font-semibold hover:underline">
                Book your first lesson →
              </Link>
            </div>
          ) : (
            recentBookings.map((booking) => {
              const cfg = statusConfig[booking.status] ?? statusConfig.PENDING;
              return (
                <div
                  key={booking.id}
                  className="px-6 py-3.5 flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center gap-2 sm:gap-4 hover:bg-brand-surface/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-black">
                      {formatScheduledAt(booking.scheduledAt)}
                    </p>
                    <p className="text-xs text-brand-muted">{formatTime(booking.scheduledAt)}</p>
                  </div>
                  <p className="text-sm text-brand-black hidden sm:block">
                    {booking.instructorName}
                  </p>
                  <p className="text-sm text-brand-muted">{formatLessonType(booking.lessonType)}</p>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full w-fit",
                      cfg.classes
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
