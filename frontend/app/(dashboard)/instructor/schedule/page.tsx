"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info, RefreshCw, CalendarDays, X, User, Clock, Hash } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { instructorApiFetch } from "@/lib/instructor-api";
import AvailabilityGridEditor from "@/components/shared/AvailabilityGridEditor";

type AvailabilityMode = "CUSTOM_SLOTS" | "CALENDAR_SYNC";

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
  availabilityMode: AvailabilityMode;
  calendarConnected: boolean;
  calendarEmail: string | null;
  bookings: Booking[];
  busy: BusyBlock[];
};

type ViewMode = "week" | "month";
type Section = "calendar" | "availability";

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

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function addMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return fmtDate(a) === fmtDate(b);
}

type Segment = {
  kind: "booking" | "busy";
  startMins: number;
  endMins: number;
  label: string;
  title: string;
  booking?: Booking;
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
      booking: b,
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

function countsForDay(day: Date, bookings: Booking[], busy: BusyBlock[]) {
  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day); dayEnd.setHours(24, 0, 0, 0);
  let bookingCount = 0;
  let busyCount = 0;
  for (const b of bookings) {
    const s = new Date(b.scheduledAt);
    const e = new Date(s.getTime() + b.durationMins * 60_000);
    if (e > dayStart && s < dayEnd) bookingCount++;
  }
  for (const b of busy) {
    const s = new Date(b.startsAt);
    const e = new Date(b.endsAt);
    if (e > dayStart && s < dayEnd) busyCount++;
  }
  return { bookingCount, busyCount };
}

export default function InstructorSchedulePage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const horizonMax = useMemo(() => addDays(today, MAX_HORIZON_DAYS), [today]);

  const [section, setSection] = useState<Section>("availability");
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modeSaving, setModeSaving] = useState(false);

  const range = useMemo(() => {
    if (view === "week") {
      const from = startOfWeek(cursor);
      const to = addDays(from, 6);
      return { from, to };
    }
    return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
  }, [view, cursor]);

  const canGoBack = useMemo(() => {
    if (view === "week") return startOfWeek(cursor) > startOfWeek(today);
    return startOfMonth(cursor) > startOfMonth(today);
  }, [view, cursor, today]);

  const canGoForward = useMemo(() => {
    if (view === "week") return addDays(startOfWeek(cursor), 7) <= horizonMax;
    return startOfMonth(addMonths(cursor, 1)) <= horizonMax;
  }, [view, cursor, horizonMax]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = fmtDate(range.from);
      const to = fmtDate(range.to);
      const res = await instructorApiFetch(`/schedule/overview?from=${from}&to=${to}`);
      if (!res.ok) { setError("Failed to load schedule"); return; }
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  // Mount: load once to get availabilityMode for the mode toggle.
  // Range change: only reload when user is actively viewing the calendar section.
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (section === "calendar") load();
  }, [section, range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const goPrev = () => setCursor(view === "week" ? addDays(cursor, -7) : addMonths(cursor, -1));
  const goNext = () => setCursor(view === "week" ? addDays(cursor, 7) : addMonths(cursor, 1));
  const goToday = () => setCursor(new Date());

  const rangeLabel = useMemo(() => {
    if (view === "week") {
      const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      return `${range.from.toLocaleDateString(undefined, opts)} — ${range.to.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
    }
    return range.from.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [view, range.from, range.to]);

  async function handleSetMode(next: AvailabilityMode, force = false) {
    setModeSaving(true);
    try {
      const res = await instructorApiFetch("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityMode: next, force }),
      });
      if (res.status === 409) {
        if (window.confirm("You have no available slots configured, so students won't be able to book you. Switch anyway?")) {
          return handleSetMode(next, true);
        }
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to update availability mode");
        return;
      }
      setData((prev) => (prev ? { ...prev, availabilityMode: next } : prev));
      toast.success("Availability mode updated");
    } finally {
      setModeSaving(false);
    }
  }

  const fetchSchedule = useCallback(() => instructorApiFetch("/schedule"), []);
  const saveSchedule = useCallback(
    (slots: unknown) =>
      instructorApiFetch("/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      }),
    []
  );

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-black">My Schedule</h1>
          <p className="text-sm text-brand-muted mt-1">Manage your availability and view your calendar.</p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-white border border-brand-border rounded-2xl p-1 mb-5 w-fit">
          <button
            onClick={() => setSection("availability")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              section === "availability"
                ? "bg-brand-red text-white shadow-sm"
                : "text-brand-muted hover:text-brand-black"
            }`}
          >
            My Availability
          </button>
          <button
            onClick={() => setSection("calendar")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              section === "calendar"
                ? "bg-brand-red text-white shadow-sm"
                : "text-brand-muted hover:text-brand-black"
            }`}
          >
            Calendar View
          </button>
        </div>

        {section === "availability" && (
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5">
            {/* Mode toggle */}
            <div className="flex items-center gap-2 mb-4 p-1 bg-brand-surface rounded-xl w-fit">
              {(["CUSTOM_SLOTS", "CALENDAR_SYNC"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={modeSaving}
                  onClick={() => handleSetMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    data?.availabilityMode === m ? "bg-white text-brand-black shadow-sm" : "text-brand-muted hover:text-brand-black"
                  }`}
                >
                  {m === "CUSTOM_SLOTS" ? "Custom Slots" : "Calendar Sync"}
                </button>
              ))}
            </div>

            {data?.availabilityMode === "CALENDAR_SYNC" ? (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Your availability is driven by your connected calendar. Blocks you add in Google/Apple Calendar automatically
                  make those slots unbookable. Switch to Custom Slots to manage your own weekly template instead.
                </p>
              </div>
            ) : (
              <p className="text-xs text-brand-muted mb-4">Students book against the weekly template below.</p>
            )}

            <AvailabilityGridEditor fetchSchedule={fetchSchedule} saveSchedule={saveSchedule} />
          </div>
        )}

        {section === "calendar" && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-white border border-brand-border rounded-xl p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setView("week")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      view === "week" ? "bg-brand-red text-white" : "text-brand-muted hover:text-brand-black"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView("month")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      view === "month" ? "bg-brand-red text-white" : "text-brand-muted hover:text-brand-black"
                    }`}
                  >
                    Month
                  </button>
                </div>
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-black bg-white hover:bg-brand-surface transition disabled:opacity-60"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {!data?.calendarConnected && !loading && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Google Calendar not connected</p>
                  <p>
                    Connect on the{" "}
                    <a href="/instructor/profile" className="underline font-semibold">Profile &rsaquo; Calendar tab</a>{" "}
                    to have your calendar events block booking slots automatically.
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-brand-muted" />
                  <span className="font-semibold text-brand-black text-sm">{rangeLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goPrev}
                    disabled={!canGoBack}
                    className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToday}
                    className="px-3 py-1.5 text-xs font-semibold text-brand-black border border-brand-border rounded-lg hover:bg-brand-surface transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canGoForward}
                    className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                <span>Blocked (calendar)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-white border border-brand-border" />
                <span>Free</span>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
            )}

            {view === "week" ? (
              <WeekGrid today={today} weekStart={range.from} data={data} onBookingClick={setSelectedBooking} />
            ) : (
              <MonthGrid
                today={today}
                monthCursor={cursor}
                data={data}
                onDayClick={(d) => { setCursor(d); setView("week"); }}
                horizonMax={horizonMax}
              />
            )}

            <p className="mt-4 text-xs text-brand-muted">
              Students can book any free hour within the next {MAX_HORIZON_DAYS} days.
            </p>
          </>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}

function BookingDetailsModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.durationMins * 60_000);
  const dateStr = start.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = `${start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

  const statusColor =
    booking.status === "CONFIRMED"
      ? "bg-green-100 text-green-700 border-green-200"
      : booking.status === "PENDING"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-gray-100 text-gray-700 border-gray-200";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-black">Booking</h2>
            <p className="text-xs text-brand-muted">Lesson details</p>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <Row icon={<User className="w-3.5 h-3.5" />} label="Student" value={booking.studentName ?? "—"} />
          <Row icon={<Hash className="w-3.5 h-3.5" />} label="Reference" value={booking.reference} mono />
          <Row icon={<CalendarDays className="w-3.5 h-3.5" />} label="Date" value={dateStr} />
          <Row icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={`${timeStr} (${booking.durationMins}m)`} />
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-brand-muted">Status</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
              {booking.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/instructor/bookings?focus=${booking.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-brand-red text-white text-xs font-semibold rounded-xl hover:bg-brand-orange transition"
          >
            Open in Bookings
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-brand-border text-brand-black text-xs font-semibold rounded-xl hover:bg-brand-surface transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs text-brand-muted flex-shrink-0">{icon}{label}</span>
      <span className={`text-xs text-brand-black font-medium text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function WeekGrid({
  today,
  weekStart,
  data,
  onBookingClick,
}: {
  today: Date;
  weekStart: Date;
  data: Overview | null;
  onBookingClick: (b: Booking) => void;
}) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-r border-brand-border p-2 text-[10px] font-semibold text-brand-muted"> </div>
        {days.map((d) => {
          const isToday = sameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={`border-b border-r last:border-r-0 border-brand-border p-2 text-center ${isToday ? "bg-brand-red/10" : ""}`}
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
            <div key={h} className="h-12 border-b border-brand-border text-[10px] text-brand-muted p-1 text-right">
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
                const bg = s.kind === "booking" ? "bg-green-500 hover:bg-green-600" : "bg-red-400";
                const clickable = s.kind === "booking" && s.booking;
                const commonProps = {
                  key: i,
                  title: s.title,
                  className: `absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold overflow-hidden ${bg} text-white shadow-sm text-left ${clickable ? "cursor-pointer transition" : ""}`,
                  style: { top: `${top}px`, height: `${height}px` },
                };
                if (clickable) {
                  return <button {...commonProps} onClick={() => onBookingClick(s.booking!)}>{s.label}</button>;
                }
                return <div {...commonProps}>{s.label}</div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({
  today,
  monthCursor,
  data,
  onDayClick,
  horizonMax,
}: {
  today: Date;
  monthCursor: Date;
  data: Overview | null;
  onDayClick: (d: Date) => void;
  horizonMax: Date;
}) {
  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(monthCursor));
    const gridEnd = addDays(startOfWeek(endOfMonth(monthCursor)), 41);
    const days: Date[] = [];
    let cur = gridStart;
    while (cur <= gridEnd) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return days;
  }, [monthCursor]);

  const monthIdx = monthCursor.getMonth();
  const past = (d: Date) => d < today;
  const future = (d: Date) => d > horizonMax;

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((l) => (
          <div key={l} className="p-2 text-center text-[10px] uppercase font-semibold text-brand-muted border-b border-r last:border-r-0 border-brand-border">
            {l}
          </div>
        ))}
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === monthIdx;
          const isToday = sameDay(d, today);
          const disabled = future(d);
          const counts = data ? countsForDay(d, data.bookings, data.busy) : { bookingCount: 0, busyCount: 0 };
          const clickable = !disabled;
          return (
            <button
              key={i}
              onClick={() => clickable && onDayClick(d)}
              disabled={!clickable}
              className={`h-24 md:h-28 p-2 border-b border-r last:border-r-0 border-brand-border text-left transition ${
                !inMonth ? "bg-brand-surface/50 text-brand-muted" : "bg-white text-brand-black"
              } ${isToday ? "ring-2 ring-brand-red ring-inset" : ""} ${
                disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-brand-surface cursor-pointer"
              } ${past(d) && !isToday ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isToday ? "text-brand-red" : ""}`}>{d.getDate()}</span>
                {(counts.bookingCount > 0 || counts.busyCount > 0) && (
                  <span className="text-[9px] text-brand-muted">{counts.bookingCount + counts.busyCount}</span>
                )}
              </div>
              <div className="space-y-1">
                {counts.bookingCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-green-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    {counts.bookingCount} booking{counts.bookingCount === 1 ? "" : "s"}
                  </div>
                )}
                {counts.busyCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-red-700">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                    {counts.busyCount} block{counts.busyCount === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
