"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  PoundSterling,
  Star,
  Users,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiTodayLesson {
  id: string;
  scheduledAt: string;
  durationMins: number;
  lessonType: string;
  studentName: string;
  studentInitials: string;
}

interface ApiUpcomingLesson {
  id: string;
  scheduledAt: string;
  durationMins: number;
  lessonType: string;
  studentName: string;
  studentInitials: string;
}

interface ApiStats {
  lessonsThisWeek: number;
  earningsThisMonth: number;
  avgRating: number;
  totalStudents: number;
  todayLessons: ApiTodayLesson[];
  upcomingLessons: ApiUpcomingLesson[];
}

interface Review {
  id: string;
  student: string;
  initials: string;
  stars: number;
  text: string;
  date: string;
}

// ─── Mock reviews (no API yet) ────────────────────────────────────────────────
const reviews: Review[] = [
  {
    id: "r1",
    student: "Amy Johnson",
    initials: "AJ",
    stars: 5,
    text: "James is an absolutely brilliant instructor. He's patient, clear, and genuinely cares about your progress. Passed first time!",
    date: "18 Apr 2025",
  },
  {
    id: "r2",
    student: "Daniel Brown",
    initials: "DB",
    stars: 5,
    text: "Can't recommend James enough. He always explained exactly why I needed to do something, which made everything stick. Fantastic teacher.",
    date: "10 Apr 2025",
  },
  {
    id: "r3",
    student: "Priya Patel",
    initials: "PP",
    stars: 4,
    text: "Very professional and encouraging. Always on time and well prepared for each lesson. I feel my confidence has really grown.",
    date: "2 Apr 2025",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIMELINE_START = 8;
const TIMELINE_END = 20;
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

function timeToFraction(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - TIMELINE_START) * 60 + m) / (TIMELINE_HOURS * 60);
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toTimeString(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function endTimeStr(dateStr: string, durationMins: number): string {
  const d = new Date(new Date(dateStr).getTime() + durationMins * 60000);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLessonType(type: string): string {
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

function formatUpcomingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatUpcomingTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const HOUR_LABELS = Array.from(
  { length: TIMELINE_HOURS + 1 },
  (_, i) => i + TIMELINE_START
);

// ─── Animation ────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  dark = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  dark?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "rounded-2xl p-5 border",
        dark
          ? "bg-brand-black border-transparent text-white"
          : "bg-white border-brand-border text-brand-black shadow-sm"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          className={cn(
            "w-4 h-4",
            dark ? "text-brand-orange" : "text-brand-red"
          )}
        />
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            dark ? "text-white/50" : "text-brand-muted"
          )}
        >
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-3xl font-extrabold leading-none mb-1",
          dark ? "text-white" : "text-brand-black"
        )}
      >
        {value}
      </p>
      <p className={cn("text-sm", dark ? "text-white/50" : "text-brand-muted")}>
        {sub}
      </p>
    </motion.div>
  );
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < count
              ? "text-yellow-400 fill-yellow-400"
              : "text-brand-border fill-brand-border"
          )}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/instructor/stats");
        if (res.ok) {
          const data = await res.json();
          setApiStats(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const todayLessons = apiStats?.todayLessons ?? [];
  const upcomingLessons = apiStats?.upcomingLessons ?? [];
  const lessonsThisWeek = apiStats?.lessonsThisWeek ?? 0;
  const earningsThisMonth = apiStats?.earningsThisMonth ?? 0;
  const avgRating = apiStats?.avgRating ?? 0;
  const totalStudents = apiStats?.totalStudents ?? 0;

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
          Welcome back, {firstName}!
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <p className="text-brand-muted text-sm">{formatDate()}</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
            <CalendarDays className="w-3 h-3" />
            {todayLessons.length} lessons today
          </span>
        </div>
      </motion.div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="This Week"
          value={String(lessonsThisWeek)}
          sub="lessons booked"
          dark
        />
        <StatCard
          icon={PoundSterling}
          label="This Month"
          value={`£${earningsThisMonth.toFixed(0)}`}
          sub="earnings"
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={avgRating.toFixed(1)}
          sub="from reviews"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={String(totalStudents)}
          sub="active students"
        />
      </div>

      {/* ── Today's timeline ── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm mb-8 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-black">Today&apos;s Schedule</h3>
            <p className="text-xs text-brand-muted mt-0.5">
              {formatDate()} &mdash; {todayLessons.length} lessons
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <TrendingUp className="w-3 h-3" /> On track
          </div>
        </div>

        <div className="p-6">
          {todayLessons.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-8">
              No lessons scheduled for today.
            </p>
          ) : (
            <div className="flex gap-4">
              {/* Hour labels */}
              <div className="w-14 shrink-0 flex flex-col">
                {HOUR_LABELS.map((h) => (
                  <div
                    key={h}
                    className="flex items-start justify-end"
                    style={{ height: `${100 / TIMELINE_HOURS}%` }}
                  >
                    <span className="text-[11px] text-brand-muted pr-2 -mt-1.5">
                      {h}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Timeline grid */}
              <div
                className="flex-1 relative border-l border-brand-border"
                style={{ height: `${TIMELINE_HOURS * 48}px` }}
              >
                {/* Hour grid lines */}
                {HOUR_LABELS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-brand-border/40"
                    style={{
                      top: `${((h - TIMELINE_START) / TIMELINE_HOURS) * 100}%`,
                    }}
                  />
                ))}

                {/* Lesson blocks */}
                {todayLessons.map((lesson) => {
                  const startStr = toTimeString(lesson.scheduledAt);
                  const endStr = endTimeStr(lesson.scheduledAt, lesson.durationMins);
                  const topFrac = timeToFraction(startStr);
                  const botFrac = timeToFraction(endStr);
                  const heightFrac = botFrac - topFrac;
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, scaleY: 0.8 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.35, delay: 0.2 }}
                      className="absolute left-2 right-2 bg-brand-red text-white rounded-xl px-3 py-2 overflow-hidden shadow-md shadow-red-900/20 cursor-pointer hover:bg-red-700 transition-colors"
                      style={{
                        top: `${topFrac * 100}%`,
                        height: `${heightFrac * 100}%`,
                        minHeight: 52,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {lesson.studentInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {lesson.studentName}
                          </p>
                          <p className="text-[10px] text-white/75 truncate">
                            {formatLessonType(lesson.lessonType)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-white/60" />
                        <span className="text-[10px] text-white/75">
                          {startStr}–{endStr}
                        </span>
                        <MapPin className="w-2.5 h-2.5 text-white/60 ml-1" />
                        <span className="text-[10px] text-white/75 truncate">
                          {lesson.durationMins} min
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Upcoming lessons table ── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-8"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-bold text-brand-black">Upcoming Lessons</h3>
          <span className="text-xs text-brand-muted">Next 7 days</span>
        </div>
        {upcomingLessons.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-8">No upcoming lessons.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface">
                  {["Student", "Date", "Time", "Type", "Duration", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {upcomingLessons.map((l, i) => (
                  <tr
                    key={l.id ?? i}
                    className="hover:bg-brand-surface/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-[10px] font-bold shrink-0">
                          {l.studentInitials}
                        </div>
                        <span className="font-medium text-brand-black text-sm">
                          {l.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-brand-black font-medium whitespace-nowrap">
                      {formatUpcomingDate(l.scheduledAt)}
                    </td>
                    <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                      {formatUpcomingTime(l.scheduledAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-brand-black border border-brand-border px-2 py-0.5 rounded-lg">
                        {formatLessonType(l.lessonType)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-brand-muted text-sm">
                      {l.durationMins} min
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-xs font-medium text-brand-red hover:text-brand-orange transition-colors">
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Recent reviews ── */}
      <motion.div variants={itemVariants}>
        <h3 className="font-bold text-brand-black mb-4">Recent Reviews</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-black leading-tight">
                    {r.student}
                  </p>
                  <p className="text-[11px] text-brand-muted">{r.date}</p>
                </div>
                <div className="ml-auto">
                  <StarRow count={r.stars} />
                </div>
              </div>
              <p className="text-sm text-brand-muted leading-relaxed">
                &ldquo;{r.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
