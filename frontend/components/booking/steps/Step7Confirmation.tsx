"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarPlus,
  Download,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";

/* ── Confetti piece ─────────────────────────────────────────── */
const CONFETTI_COLORS = [
  "#E8200A", "#FF5500", "#FFB800", "#00C853", "#2979FF", "#AA00FF",
];

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 1.5,
    size: 6 + Math.floor(Math.random() * 6),
    rotate: Math.random() * 360,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 0.5,
            backgroundColor: p.color,
            rotate: p.rotate,
          }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate + 540 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated SVG checkmark ─────────────────────────────────── */
function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-brand-red/20"
      style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <motion.path
          d="M14 28l10 10 18-18"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, delay: 0.45, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}

/* ── iCal generator ─────────────────────────────────────────── */
function buildIcs(
  date: Date,
  slot: string,
  instructorName: string,
  ref: string
): string {
  const dt = new Date(date);
  const [h, m] = slot.split(":").map(Number);
  dt.setHours(h, m, 0, 0);
  const dtEnd = new Date(dt.getTime() + 60 * 60_000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AutoPilot Driving School//EN",
    "BEGIN:VEVENT",
    `UID:${ref}@autopilot.co.uk`,
    `DTSTART:${fmt(dt)}`,
    `DTEND:${fmt(dtEnd)}`,
    `SUMMARY:AutoPilot Driving Lesson with ${instructorName}`,
    `DESCRIPTION:Booking ref: ${ref}\\nInstructor: ${instructorName}`,
    "LOCATION:As arranged with instructor",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/* ── Google Calendar URL ────────────────────────────────────── */
function buildGcUrl(
  date: Date,
  slot: string,
  instructorName: string,
  ref: string
): string {
  const start = format(date, "yyyyMMdd") + "T" + slot.replace(":", "") + "00";
  const endHour = String(parseInt(slot.split(":")[0]) + 1).padStart(2, "0");
  const end = format(date, "yyyyMMdd") + "T" + endHour + slot.split(":")[1] + "00";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `AutoPilot Driving Lesson with ${instructorName}`,
    dates: `${start}/${end}`,
    details: `Booking ref: ${ref}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ── Main Step7Confirmation ─────────────────────────────────── */
export function Step7Confirmation() {
  const {
    bookingReference,
    selectedPackage,
    selectedInstructor,
    selectedDate,
    selectedSlot,
    lessonType,
    promoDiscount,
    reset,
  } = useBookingStore();

  const confettiShown = useRef(false);

  useEffect(() => {
    confettiShown.current = true;
  }, []);

  const ref = bookingReference ?? "—";
  const instructorName = selectedInstructor?.user.name ?? "Your Instructor";
  const total = Math.max(0, (selectedPackage?.price ?? 0) - promoDiscount);

  const formattedDate =
    selectedDate && selectedSlot
      ? `${format(selectedDate, "EEEE, d MMMM yyyy")} at ${selectedSlot}`
      : "";

  function handleIcs() {
    if (!selectedDate || !selectedSlot) return;
    const content = buildIcs(selectedDate, selectedSlot, instructorName, ref);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driving-lesson-${ref}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const gcUrl =
    selectedDate && selectedSlot
      ? buildGcUrl(selectedDate, selectedSlot, instructorName, ref)
      : "#";

  const lessonLabel: Record<string, string> = {
    MANUAL: "Manual Lesson",
    AUTOMATIC: "Automatic Lesson",
    INTENSIVE: "Intensive Course",
    REFRESHER: "Refresher Lesson",
    PASS_PLUS: "Pass Plus",
    THEORY: "Theory Test Prep",
  };

  return (
    <div className="relative">
      {/* Confetti burst */}
      <Confetti />

      <div className="text-center">
        <AnimatedCheck />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {/* Heading */}
          <h2
            className="text-4xl font-extrabold text-brand-red mb-2"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Booking Confirmed!
          </h2>
          <p className="text-brand-muted mb-8 max-w-sm mx-auto">
            We&apos;ve sent a confirmation to your email. See you on the road!
          </p>

          {/* Reference badge */}
          <div className="inline-flex flex-col items-center bg-brand-surface border border-brand-border rounded-2xl px-10 py-5 mb-10 shadow-sm">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">
              Booking Reference
            </p>
            <p
              className="text-3xl font-extrabold text-brand-red tracking-[0.15em]"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              {ref}
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 text-left max-w-md mx-auto mb-8 shadow-sm">
            {[
              { label: "Instructor", value: instructorName },
              {
                label: "Lesson",
                value: lessonType ? (lessonLabel[lessonType] ?? lessonType) : "—",
              },
              { label: "Date & Time", value: formattedDate || "—" },
              { label: "Package", value: selectedPackage?.name ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between items-start py-2.5 border-b border-brand-border last:border-b-0 text-sm gap-4"
              >
                <span className="text-brand-muted shrink-0">{label}</span>
                <span className="font-semibold text-brand-black text-right">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-1">
              <span className="font-bold text-brand-black">Amount Paid</span>
              <span className="text-2xl font-extrabold text-brand-red">£{total}</span>
            </div>
          </div>

          {/* Calendar actions */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a
              href={gcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-border text-brand-black rounded-full text-sm font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </a>
            <button
              onClick={handleIcs}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-border text-brand-black rounded-full text-sm font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              Download .ics
            </button>
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-7 py-3 border-2 border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Book Another Lesson
            </button>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
