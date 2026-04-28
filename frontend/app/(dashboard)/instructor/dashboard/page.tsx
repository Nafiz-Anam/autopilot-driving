"use client";

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
interface TodayLesson {
  id: string;
  start: string; // "HH:MM"
  end: string;
  student: string;
  studentInitials: string;
  type: string;
  area: string;
}

interface UpcomingLesson {
  date: string;
  time: string;
  student: string;
  studentInitials: string;
  type: string;
  area: string;
  duration: string;
}

interface Review {
  id: string;
  student: string;
  initials: string;
  stars: number;
  text: string;
  date: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const todayLessons: TodayLesson[] = [
  {
    id: "l1",
    start: "09:00",
    end: "10:00",
    student: "Amy Johnson",
    studentInitials: "AJ",
    type: "Manual Lesson",
    area: "Slough Town Centre",
  },
  {
    id: "l2",
    start: "11:00",
    end: "12:00",
    student: "Ben Clarke",
    studentInitials: "BC",
    type: "Manual Lesson",
    area: "Windsor Road, Slough",
  },
  {
    id: "l3",
    start: "14:00",
    end: "16:00",
    student: "Chloe Davis",
    studentInitials: "CD",
    type: "Mock Test Prep",
    area: "Slough Test Centre",
  },
];

const upcomingLessons: UpcomingLesson[] = [
  {
    date: "Tue 29 Apr",
    time: "10:00am",
    student: "Amy Johnson",
    studentInitials: "AJ",
    type: "Manual",
    area: "Slough",
    duration: "1 hr",
  },
  {
    date: "Wed 30 Apr",
    time: "2:00pm",
    student: "Ben Clarke",
    studentInitials: "BC",
    type: "Manual",
    area: "Windsor",
    duration: "1 hr",
  },
  {
    date: "Thu 1 May",
    time: "9:00am",
    student: "Chloe Davis",
    studentInitials: "CD",
    type: "Auto",
    area: "Slough",
    duration: "1 hr",
  },
  {
    date: "Fri 2 May",
    time: "11:00am",
    student: "Daniel Brown",
    studentInitials: "DB",
    type: "Manual",
    area: "Burnham",
    duration: "1 hr",
  },
  {
    date: "Sat 3 May",
    time: "10:00am",
    student: "Emma Wilson",
    studentInitials: "EW",
    type: "Manual",
    area: "Langley",
    duration: "1 hr",
  },
];

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
const TIMELINE_START = 8; // 8am
const TIMELINE_END = 20; // 8pm
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
  icon: React.ElementType;
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
            "w-4.5 h-4.5",
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
          value="8"
          sub="lessons booked"
          dark
        />
        <StatCard
          icon={PoundSterling}
          label="This Month"
          value="£840"
          sub="20 lessons"
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value="4.9"
          sub="64 reviews"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value="12"
          sub="3 new this month"
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
              Mon 28 Apr 2025 &mdash; {todayLessons.length} lessons
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            <TrendingUp className="w-3 h-3" /> On track
          </div>
        </div>

        <div className="p-6">
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
                const topFrac = timeToFraction(lesson.start);
                const botFrac = timeToFraction(lesson.end);
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
                          {lesson.student}
                        </p>
                        <p className="text-[10px] text-white/75 truncate">
                          {lesson.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5 text-white/60" />
                      <span className="text-[10px] text-white/75">
                        {lesson.start}–{lesson.end}
                      </span>
                      <MapPin className="w-2.5 h-2.5 text-white/60 ml-1" />
                      <span className="text-[10px] text-white/75 truncate">
                        {lesson.area}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Upcoming lessons table ── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-8"
      >
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-bold text-brand-black">
            Upcoming Lessons
          </h3>
          <span className="text-xs text-brand-muted">Next 7 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface">
                {["Student", "Date", "Time", "Type", "Area", "Duration", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {upcomingLessons.map((l, i) => (
                <tr
                  key={i}
                  className="hover:bg-brand-surface/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-[10px] font-bold shrink-0">
                        {l.studentInitials}
                      </div>
                      <span className="font-medium text-brand-black text-sm">
                        {l.student}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-brand-black font-medium whitespace-nowrap">
                    {l.date}
                  </td>
                  <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                    {l.time}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-brand-black border border-brand-border px-2 py-0.5 rounded-lg">
                      {l.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-muted text-sm">
                    {l.area}
                  </td>
                  <td className="px-5 py-3 text-brand-muted text-sm">
                    {l.duration}
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
