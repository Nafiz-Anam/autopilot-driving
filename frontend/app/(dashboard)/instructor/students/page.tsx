"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users,
  CalendarDays,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LessonRecord {
  date: string;
  type: string;
  duration: string;
  notes: string;
}

interface Student {
  id: string;
  name: string;
  initials: string;
  totalLessons: number;
  lastLesson: string;
  progress: number; // 0-100
  phone: string;
  lessons: LessonRecord[];
  notes: string;
}

interface ApiStudentBooking {
  scheduledAt: string;
  lessonType: string;
  durationMins: number;
  status: string;
  notes?: string;
}

interface ApiStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalLessons: number;
  completedLessons: number;
  lastLesson: string | null;
  progress: number;
  recentBookings: ApiStudentBooking[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

function formatBookingDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapApiStudent(s: ApiStudent): Student {
  return {
    id: s.id,
    name: s.name,
    initials: getInitials(s.name),
    totalLessons: s.totalLessons,
    lastLesson: s.lastLesson ? formatBookingDate(s.lastLesson) : "No lessons yet",
    progress: s.progress ?? 0,
    phone: s.phone ?? "",
    notes: "",
    lessons: (s.recentBookings ?? []).map((b) => ({
      date: formatBookingDate(b.scheduledAt),
      type: formatLessonType(b.lessonType),
      duration: `${b.durationMins} min`,
      notes: b.notes ?? "",
    })),
  };
}

// ─── Progress colours ─────────────────────────────────────────────────────────
function progressColor(p: number): string {
  if (p >= 75) return "bg-green-500";
  if (p >= 50) return "bg-brand-orange";
  return "bg-brand-red";
}

// ─── Expanded panel ───────────────────────────────────────────────────────────
function StudentPanel({ student }: { student: Student }) {
  const [notes, setNotes] = useState(student.notes);
  const [noteSaved, setNoteSaved] = useState(false);

  function saveNotes() {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="border-t border-brand-border mt-4 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Lesson history */}
        <div>
          <h4 className="text-xs font-bold text-brand-black uppercase tracking-wide mb-3">
            Lesson History
          </h4>
          {student.lessons.length === 0 ? (
            <p className="text-xs text-brand-muted">No lesson records yet.</p>
          ) : (
            <div className="space-y-2">
              {student.lessons.map((l, i) => (
                <div
                  key={i}
                  className="flex gap-3 text-xs border border-brand-border rounded-xl p-3 bg-brand-surface/50"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-brand-black">
                      {l.date}{" "}
                      <span className="font-normal text-brand-muted">
                        &middot; {l.type} &middot; {l.duration}
                      </span>
                    </p>
                    {l.notes && (
                      <p className="text-brand-muted mt-0.5">{l.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes + actions */}
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-bold text-brand-black uppercase tracking-wide mb-2">
              Instructor Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNoteSaved(false);
              }}
              rows={5}
              placeholder="Add private notes about this student…"
              className="w-full px-3 py-2.5 border border-brand-border rounded-xl text-sm text-brand-black resize-none focus:outline-none focus:ring-2 focus:ring-brand-red bg-white"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={saveNotes}
                className="px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-semibold hover:bg-brand-orange transition-colors"
              >
                Save Notes
              </button>
              <AnimatePresence>
                {noteSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-xs text-green-600 font-medium"
                  >
                    <Check className="w-3 h-3" /> Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 border border-brand-border rounded-xl text-sm font-medium text-brand-black hover:bg-brand-surface transition-colors w-fit">
            <MessageSquare className="w-4 h-4 text-brand-red" />
            Send Message
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Student card ─────────────────────────────────────────────────────────────
function StudentCard({ student }: { student: Student }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-brand-red to-brand-orange flex items-center justify-center text-white text-sm font-bold shrink-0">
          {student.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-brand-black text-base leading-tight">
              {student.name}
            </h3>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="shrink-0 p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted mb-3">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {student.totalLessons} lessons
            </span>
            <span>Last: {student.lastLesson}</span>
            {student.phone && (
              <a
                href={`tel:${student.phone}`}
                className="text-brand-red font-medium hover:text-brand-orange transition-colors"
              >
                {student.phone}
              </a>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-brand-border rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", progressColor(student.progress))}
                initial={{ width: "0%" }}
                animate={{ width: `${student.progress}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-bold text-brand-black shrink-0">
              {student.progress}%
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && <StudentPanel student={student} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstructorStudentsPage() {
  useSession();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/instructor/students");
        if (res.ok) {
          const data = await res.json();
          const raw: ApiStudent[] = Array.isArray(data) ? data : data.data ?? [];
          setStudents(raw.map(mapApiStudent));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filtered = useMemo(
    () =>
      students.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      ),
    [students, query]
  );

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-64" />
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-brand-black">
            My Students
          </h1>
          <p className="text-brand-muted mt-1 text-sm">
            {students.length} active student{students.length !== 1 ? "s" : ""} — track lessons, add notes,
            and manage progress.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-2">
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold">{students.length}</span>
          <span className="text-xs text-brand-muted">students</span>
        </div>
      </motion.div>

      {/* ── Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students by name…"
          className="w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl text-sm bg-white text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black text-lg leading-none"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </motion.div>

      {/* ── Student list ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center shadow-sm">
          <Users className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm">
            {query
              ? `No students match "${query}"`
              : "No students yet."}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filtered.map((student) => (
            <motion.div key={student.id} variants={itemVariants}>
              <StudentCard student={student} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
