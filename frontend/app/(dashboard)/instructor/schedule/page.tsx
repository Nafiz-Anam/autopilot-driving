"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type CellState = "available" | "unavailable" | "booked";
type AvailabilityGrid = Record<string, CellState>;

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const HOURS = Array.from({ length: 11 }, (_, i) =>
  String(i + 8).padStart(2, "0") + ":00"
); // 08:00 – 18:00

// ─── Build default grid ───────────────────────────────────────────────────────
function buildDefaultGrid(): AvailabilityGrid {
  const grid: AvailabilityGrid = {};
  for (const day of DAYS) {
    for (const hour of HOURS) {
      const key = `${day}-${hour}`;
      const h = parseInt(hour);
      const isWeekend = day === "Sunday";
      grid[key] = !isWeekend && h >= 8 && h < 18 ? "available" : "unavailable";
    }
  }
  return grid;
}

// ─── Cell component ───────────────────────────────────────────────────────────
function Cell({
  state,
  onToggle,
  dayLabel,
  hour,
}: {
  state: CellState;
  onToggle: () => void;
  dayLabel: string;
  hour: string;
}) {
  if (state === "booked") {
    return (
      <div
        className="w-full h-9 rounded-lg bg-brand-red flex items-center justify-center cursor-not-allowed"
        title={`${dayLabel} ${hour} — Booked`}
        aria-label={`${dayLabel} ${hour} booked`}
      >
        <span className="text-[10px] font-bold text-white tracking-wide">
          BOOKED
        </span>
      </div>
    );
  }

  const isAvailable = state === "available";

  return (
    <button
      onClick={onToggle}
      title={`${dayLabel} ${hour} — ${isAvailable ? "Click to mark unavailable" : "Click to mark available"}`}
      aria-label={`${dayLabel} ${hour} ${isAvailable ? "available" : "unavailable"}`}
      className={cn(
        "w-full h-9 rounded-lg border-2 transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1",
        isAvailable
          ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200 focus:ring-green-400"
          : "bg-white border-brand-border text-brand-border hover:border-brand-red hover:bg-red-50 focus:ring-brand-red"
      )}
    >
      {isAvailable && <Check className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstructorSchedulePage() {
  useSession();
  const [grid, setGrid] = useState<AvailabilityGrid>(buildDefaultGrid);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Fetch existing availability on mount
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/instructor/schedule");
        if (res.ok) {
          const data = await res.json();
          // API returns array of slot objects: { day, hour, state }
          const slots: { day: string; hour: string; state: CellState }[] =
            Array.isArray(data) ? data : data.slots ?? [];
          if (slots.length > 0) {
            const newGrid = buildDefaultGrid();
            for (const slot of slots) {
              const key = `${slot.day}-${slot.hour}`;
              if (key in newGrid) {
                newGrid[key] = slot.state;
              }
            }
            setGrid(newGrid);
          }
        }
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchSchedule();
  }, []);

  function toggle(day: string, hour: string) {
    const key = `${day}-${hour}`;
    if (grid[key] === "booked") return;
    setGrid((prev) => ({
      ...prev,
      [key]: prev[key] === "available" ? "unavailable" : "available",
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Convert grid to array of slot objects
      const slots = Object.entries(grid).map(([key, state]) => {
        const [day, hour] = key.split(/-(?=\d{2}:)/);
        return { day, hour, state };
      });
      const res = await fetch("/api/instructor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const availableCount = Object.values(grid).filter(
    (v) => v === "available"
  ).length;
  const bookedCount = Object.values(grid).filter((v) => v === "booked").length;

  if (loadingInitial) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse w-64" />
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
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
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-brand-black">
            My Availability
          </h1>
          <p className="text-brand-muted mt-1 text-sm">
            Click slots to toggle available / unavailable. Booked lessons are
            locked.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "shrink-0 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2",
            saved
              ? "bg-green-500 text-white"
              : "bg-brand-red text-white hover:bg-brand-orange disabled:opacity-60"
          )}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : (
            "Save Availability"
          )}
        </button>
      </motion.div>

      {/* ── Stats bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="flex flex-wrap gap-4 mb-5"
      >
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-sm text-brand-muted">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-green-600" />
          </div>
          Available
          <span className="font-semibold text-brand-black ml-1">
            ({availableCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-brand-muted">
          <div className="w-4 h-4 bg-white border-2 border-brand-border rounded" />
          Unavailable
        </div>
        <div className="flex items-center gap-1.5 text-sm text-brand-muted">
          <div className="w-4 h-4 bg-brand-red rounded" />
          Booked
          <span className="font-semibold text-brand-black ml-1">
            ({bookedCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-brand-muted ml-auto">
          <Info className="w-3.5 h-3.5" />
          Weekly availability template
        </div>
      </motion.div>

      {/* ── Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-x-auto"
      >
        <table className="w-full text-sm border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-brand-surface px-4 py-3.5 text-left text-xs font-semibold text-brand-muted w-20 border-b border-brand-border">
                Time
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-2 py-3.5 text-center text-xs font-semibold text-brand-black bg-brand-surface border-b border-brand-border whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{day.slice(0, 3)}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, rowIdx) => (
              <tr
                key={hour}
                className={cn(
                  "border-t border-brand-border/50",
                  rowIdx % 2 === 0 ? "bg-white" : "bg-brand-surface/30"
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-1.5 text-xs font-medium text-brand-muted whitespace-nowrap">
                  {hour}
                </td>
                {DAYS.map((day) => {
                  const key = `${day}-${hour}`;
                  return (
                    <td key={day} className="px-1.5 py-1.5">
                      <Cell
                        state={grid[key] ?? "unavailable"}
                        onToggle={() => toggle(day, hour)}
                        dayLabel={day}
                        hour={hour}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* ── Save notice ── */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 flex items-center gap-2 text-sm text-green-700 font-medium"
          >
            <Check className="w-4 h-4 text-green-500" />
            Availability saved — your students can now see your open slots.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
