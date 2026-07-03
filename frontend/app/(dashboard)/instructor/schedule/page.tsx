"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info, RefreshCw, CalendarDays } from "lucide-react";
import { backendApiFetch } from "@/lib/backend-auth-fetch";

type Booking = {
  id: string;
  reference: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  studentName: string | null;
};

type BusyBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  source: string;
};

type Overview = {
  from: string;
  to: string;
  calendarConnected: boolean;
  calendarEmail: string | null;
  bookings: Booking[];
  busy: BusyBlock[];
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_HORIZON_DAYS = 60;

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Segment = {
  kind: "booking" | "busy";
  startMins: number;
  endMins: number;
  label: string;
  title: string;
};

function segmentsForDay(day: Date, bookings: Booking[], busy: BusyBlock[]): Segment[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(24, 0, 0, 0);
  const segs: Segment[] = [];

  for (const b of bookings) {
    const s = new Date(b.scheduledAt);
    const e = new Date(s.getTime() + b.durationMins * 60_000);
    if (e <= dayStart || s >= dayEnd) continue;
    const segStart = Math.max(s.getTime(), dayStart.getTime());
    const segEnd = Math.min(e.getTime(), dayEnd.getTime());
    segs.push({
      kind: "booking",
      startMins: (segStart - dayStart.getTime()) / 60_000,
      endMins: (segEnd - dayStart.getTime()) / 60_000,
      label: b.studentName ?? "Booking",
      title: `${b.reference} · ${b.studentName ?? "Student"} · ${b.durationMins}m`,
    });
  }
  for (const b of busy) {
    const s = new Date(b.startsAt);
    const e = new Date(b.endsAt);
    if (e <= dayStart || s >= dayEnd) continue;
    const segStart = Math.max(s.getTime(), dayStart.getTime());
    const segEnd = Math.min(e.getTime(), dayEnd.getTime());
    segs.push({
      kind: "busy",
      startMins: (segStart - dayStart.getTime()) / 60_000,
      endMins: (segEnd - dayStart.getTime()) / 60_000,
      label: "Busy",
      title: `Blocked in Google Calendar${b.isAllDay ? " (all day)" : ""}`,
    });
  }

  return segs.sort((a, b) => a.startMins - b.startMins);
}

export default function InstructorSchedulePage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const horizonMax = useMemo(() => addDays(today, MAX_HORIZON_DAYS), [today]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const canGoBack = weekStart > startOfWeek(today);
  const canGoForward = addDays(weekStart, 7) <= horizonMax;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = fmtDate(weekStart);
      const to = fmtDate(weekEnd);
      const res = await backendApiFetch(`/instructor/schedule/overview?from=${from}&to=${to}`);
      if (!res.ok) {
        setError("Failed to load schedule");
        return;
      }
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const rangeLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString(undefined, opts)} — ${weekEnd.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
  }, [weekStart, weekEnd]);

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-black">My Schedule</h1>
            <p className="text-sm text-brand-muted mt-1">
              Read-only view. Bookings and Google Calendar blocks only.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-black hover:bg-white transition disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {!data?.calendarConnected && !loading && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Google Calendar not connected</p>
              <p>
                Without it, students see your whole 24h open every day. Connect on the{" "}
                <a href="/instructor/profile" className="underline font-semibold">Profile page</a>{" "}
                to have your Google Calendar events block booking slots automatically.
              </p>
            </div>
          </div>
        )}

        {data?.calendarConnected && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-800">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Synced with <span className="font-semibold">{data.calendarEmail}</span>. Block time in Google Calendar to make yourself unavailable.
            </span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-muted" />
              <span className="font-semibold text-brand-black text-sm">{rangeLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="px-3 py-1.5 text-xs font-semibold text-brand-black border border-brand-border rounded-lg hover:bg-brand-surface transition"
              >
                Today
              </button>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                disabled={!canGoForward}
                className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-brand-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            <span>Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
            <span>Blocked (Google)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-white border border-brand-border" />
            <span>Free</span>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
            <div className="border-b border-r border-brand-border p-2 text-[10px] font-semibold text-brand-muted"> </div>
            {days.map((d) => {
              const isToday = fmtDate(d) === fmtDate(today);
              return (
                <div
                  key={d.toISOString()}
                  className={`border-b border-r last:border-r-0 border-brand-border p-2 text-center ${
                    isToday ? "bg-brand-red/10" : ""
                  }`}
                >
                  <div className="text-[10px] uppercase text-brand-muted">
                    {DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </div>
                  <div className={`text-sm font-bold ${isToday ? "text-brand-red" : "text-brand-black"}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}

            <div className="border-r border-brand-border">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-12 border-b border-brand-border text-[10px] text-brand-muted p-1 text-right"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((d) => {
              const segs = data ? segmentsForDay(d, data.bookings, data.busy) : [];
              return (
                <div key={d.toISOString()} className="relative border-r last:border-r-0 border-brand-border">
                  {HOURS.map((h) => (
                    <div key={h} className="h-12 border-b border-brand-border" />
                  ))}
                  {segs.map((s, i) => {
                    const top = (s.startMins / 60) * 48;
                    const height = Math.max(18, ((s.endMins - s.startMins) / 60) * 48);
                    const bg = s.kind === "booking" ? "bg-green-500" : "bg-red-400";
                    return (
                      <div
                        key={i}
                        title={s.title}
                        className={`absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold overflow-hidden ${bg} text-white shadow-sm`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-brand-muted">
          Students can book any free hour within the next {MAX_HORIZON_DAYS} days. To make time unavailable, add an event in your Google Calendar.
        </p>
      </div>
    </div>
  );
}
