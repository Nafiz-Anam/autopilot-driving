"use client";

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

interface MockBooking {
  id: string;
  date: string;
  time: string;
  instructor: string;
  type: string;
  status: BookingStatus;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockBookings: MockBooking[] = [
  {
    id: "b1",
    date: "Mon 5 May 2025",
    time: "10:00am",
    instructor: "James Williams",
    type: "Manual Lesson",
    status: "CONFIRMED",
  },
  {
    id: "b2",
    date: "Wed 30 Apr 2025",
    time: "2:00pm",
    instructor: "James Williams",
    type: "Manual Lesson",
    status: "COMPLETED",
  },
  {
    id: "b3",
    date: "Mon 28 Apr 2025",
    time: "10:00am",
    instructor: "James Williams",
    type: "Manual Lesson",
    status: "COMPLETED",
  },
  {
    id: "b4",
    date: "Thu 24 Apr 2025",
    time: "9:00am",
    instructor: "James Williams",
    type: "Mock Test Prep",
    status: "COMPLETED",
  },
  {
    id: "b5",
    date: "Mon 21 Apr 2025",
    time: "10:00am",
    instructor: "James Williams",
    type: "Manual Lesson",
    status: "CANCELLED",
  },
];

const statusConfig: Record<
  BookingStatus,
  { label: string; classes: string }
> = {
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

// ─── Helper ───────────────────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  accent,
}: {
  icon: React.ElementType;
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
      <motion.div
        variants={itemVariants}
        className="bg-brand-black text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden"
      >
        {/* Decorative circle */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/4 pointer-events-none" />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-brand-red/20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-red-900/40">
            JW
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
              Your Next Lesson
            </p>
            <h3 className="text-xl font-bold leading-tight">
              Monday, 5 May 2025
            </h3>
            <p className="text-white/65 text-sm mt-1">
              10:00am &middot; Manual Lesson &middot; James Williams
            </p>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-2 relative z-10">
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-0.5">
              Coming up in
            </p>
            <p className="text-3xl font-extrabold text-brand-orange leading-none">
              7 days
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="Lessons Completed"
          value="4"
          trend="up"
          trendLabel="+1 this week"
          accent="bg-brand-red"
        />
        <StatCard
          icon={Clock}
          label="Hours Driven"
          value="4 hrs"
          trend="up"
          trendLabel="+1 hr this week"
          accent="bg-brand-orange"
        />
        <StatCard
          icon={Trophy}
          label="Theory Score"
          value="72%"
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
          <span className="text-xl font-extrabold text-brand-red">28%</span>
        </div>
        <div className="h-2.5 bg-brand-surface rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-linear-to-r from-brand-red to-brand-orange rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "28%" }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-brand-muted">
          <span>4 of ~45 lessons completed</span>
          <span>Est. pass readiness: <strong className="text-brand-black">Low</strong></span>
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
          {mockBookings.map((booking) => {
            const cfg = statusConfig[booking.status];
            return (
              <div
                key={booking.id}
                className="px-6 py-3.5 flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center gap-2 sm:gap-4 hover:bg-brand-surface/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-black">
                    {booking.date}
                  </p>
                  <p className="text-xs text-brand-muted">{booking.time}</p>
                </div>
                <p className="text-sm text-brand-black hidden sm:block">
                  {booking.instructor}
                </p>
                <p className="text-sm text-brand-muted">{booking.type}</p>
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
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
