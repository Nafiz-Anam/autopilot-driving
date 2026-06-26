"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, X, CalendarClock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApiFetch } from "@/lib/admin-api";

interface PendingReschedule {
  id: string;
  requestedByRole: string;
  requesterName: string | null;
  proposedDateTime: string;
  reason: string | null;
}

interface BookingRecord {
  id: string;
  reference: string;
  lessonType: string;
  transmission: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  notes: string | null;
  student: { id: string; name: string | null; email: string };
  instructor: { user: { id: string; name: string | null } };
  pendingReschedule?: PendingReschedule | null;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

// Statuses available in the inline badge dropdown (CANCELLED handled via modal)
const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "PARTIAL_REFUND"] as const;

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  CONFIRMED:  { label: "Confirmed",  classes: "bg-green-100 text-green-700 border border-green-200" },
  COMPLETED:  { label: "Completed",  classes: "bg-gray-100 text-brand-muted border border-gray-200" },
  CANCELLED:  { label: "Cancelled",  classes: "bg-red-50 text-brand-red border border-red-100" },
  PENDING:    { label: "Pending",    classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  NO_SHOW:    { label: "No Show",    classes: "bg-orange-50 text-orange-700 border border-orange-100" },
};

const PAYMENT_CONFIG: Record<string, { label: string; classes: string }> = {
  PAID:           { label: "Paid",         classes: "bg-green-100 text-green-700 border border-green-200" },
  UNPAID:         { label: "Unpaid",       classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  REFUNDED:       { label: "Refunded",     classes: "bg-gray-100 text-brand-muted border border-gray-200" },
  PARTIAL_REFUND: { label: "Part. Refund", classes: "bg-blue-50 text-blue-600 border border-blue-200" },
};

const CANCEL_REASONS = [
  "Scheduling conflict", "Instructor unavailable", "Student request",
  "Payment issue", "No show", "Other",
];
const RESCHEDULE_REASONS = [
  "Scheduling conflict", "Instructor unavailable", "Student request", "Emergency", "Other",
];

const LESSON_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Manual", AUTOMATIC: "Auto", INTENSIVE: "Intensive",
  MOTORWAY: "Motorway", PASS_PLUS: "Pass Plus", REFRESHER: "Refresher", THEORY: "Theory",
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BadgeDropdown({
  value, options, config, disabled, onChange,
}: {
  value: string; options: readonly string[];
  config: Record<string, { label: string; classes: string }>;
  disabled: boolean; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = config[value] ?? { label: value, classes: "bg-gray-100 text-brand-muted border border-gray-200" };

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
          cfg.classes, disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"
        )}
      >
        {cfg.label}
        {!disabled && <ChevronDown className="w-3 h-3 opacity-60" />}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-brand-border rounded-xl shadow-lg z-30 overflow-hidden min-w-[130px]">
          {options.map((opt) => {
            const c = config[opt] ?? { label: opt, classes: "" };
            const bg = c.classes.split(" ").find((s) => s.startsWith("bg-")) ?? "";
            return (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={cn("flex items-center w-full px-3 py-2 text-xs font-semibold hover:bg-brand-surface transition-colors gap-2",
                  value === opt ? "opacity-40 cursor-default" : "")}>
                <span className={cn("w-2 h-2 rounded-full shrink-0", bg)} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Cancel Modal ────────────────────────────────────────────────────────────
function CancelModal({ booking, onClose, onDone }: {
  booking: BookingRecord;
  onClose: () => void;
  onDone: (id: string, updates: Partial<BookingRecord>) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [issueRefund, setIssueRefund] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isPaid = ["PAID", "PARTIAL_REFUND"].includes(booking.paymentStatus);

  async function submit() {
    if (!reason) { setErr("Please select a reason."); return; }
    setSaving(true);
    const patch: Record<string, string | null> = {
      status: "CANCELLED",
      notes: [reason, notes].filter(Boolean).join(" — ") || null,
    };
    if (issueRefund && isPaid) patch.paymentStatus = "REFUNDED";
    try {
      const res = await adminApiFetch(`/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        toast.success("Booking cancelled");
        onDone(booking.id, patch);
      } else {
        setErr("Failed to cancel booking.");
      }
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-brand-black text-lg">Cancel Booking</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Booking summary */}
          <div className="bg-brand-surface rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-brand-black">{booking.student.name ?? booking.student.email}</p>
            <p className="text-brand-muted">{booking.instructor.user.name} · {formatDate(booking.scheduledAt)} {formatTime(booking.scheduledAt)}</p>
            <p className="font-mono text-xs text-brand-muted">{booking.reference}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">Reason <span className="text-brand-red">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30">
              <option value="">Select a reason</option>
              {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">Notes <span className="text-brand-muted font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="Additional context..." />
          </div>

          {isPaid && (
            <label className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 cursor-pointer">
              <input type="checkbox" checked={issueRefund} onChange={(e) => setIssueRefund(e.target.checked)}
                className="w-4 h-4 accent-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Issue full refund</p>
                <p className="text-xs text-green-700">Payment status will be set to Refunded · £{Number(booking.totalAmount).toFixed(2)}</p>
              </div>
            </label>
          )}

          {err && <p className="text-xs text-brand-red">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-black transition-colors">
            Keep Booking
          </button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
            {saving ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reschedule Modal (Admin: direct update) ──────────────────────────────────
function RescheduleModal({ booking, onClose, onDone }: {
  booking: BookingRecord;
  onClose: () => void;
  onDone: (id: string, updates: Partial<BookingRecord>) => void;
}) {
  const [newDateTime, setNewDateTime] = useState(toLocalDatetimeValue(booking.scheduledAt));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!reason) { setErr("Please select a reason."); return; }
    if (!newDateTime) { setErr("Please select a new date and time."); return; }
    setSaving(true);
    const scheduledAt = new Date(newDateTime).toISOString();
    const combinedNotes = [reason, notes].filter(Boolean).join(" — ") || null;
    try {
      const res = await adminApiFetch(`/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, notes: combinedNotes }),
      });
      if (res.ok) {
        toast.success("Lesson rescheduled");
        onDone(booking.id, { scheduledAt });
      } else {
        setErr("Failed to reschedule booking.");
      }
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-brand-black text-lg">Reschedule Lesson</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 text-blue-700 rounded-xl px-3 py-2 text-xs">
            As admin, this will directly update the booking date — no approval needed. Both parties will see the change immediately.
          </div>
          <div className="bg-brand-surface rounded-xl p-3 text-sm">
            <p className="font-semibold text-brand-black">{booking.student.name ?? booking.student.email}</p>
            <p className="text-brand-muted text-xs">Currently: {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">New Date & Time <span className="text-brand-red">*</span></label>
            <input type="datetime-local" value={newDateTime} onChange={(e) => setNewDateTime(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">Reason <span className="text-brand-red">*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30">
              <option value="">Select a reason</option>
              {RESCHEDULE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">Notes <span className="text-brand-muted font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-red/30"
              placeholder="Additional context..." />
          </div>
          {err && <p className="text-xs text-brand-red">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-black transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 bg-brand-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Reschedule Lesson"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BookingDetailsModal({ booking, onClose, onCancel, onReschedule }: {
  booking: BookingRecord;
  onClose: () => void;
  onCancel: (b: BookingRecord) => void;
  onReschedule: (b: BookingRecord) => void;
}) {
  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
  const rows: [string, string][] = [
    ["Reference",   booking.reference],
    ["Student",     `${booking.student.name ?? "—"} (${booking.student.email})`],
    ["Instructor",  booking.instructor.user.name ?? "—"],
    ["Date & Time", `${formatDate(booking.scheduledAt)} ${formatTime(booking.scheduledAt)}`],
    ["Duration",    `${booking.durationMins} min`],
    ["Type",        LESSON_TYPE_LABELS[booking.lessonType] ?? booking.lessonType],
    ["Transmission",booking.transmission],
    ["Amount",      `£${Number(booking.totalAmount).toFixed(2)}`],
    ["Payment",     booking.paymentStatus],
    ["Status",      booking.status],
    ...(booking.notes ? [["Notes", booking.notes] as [string, string]] : []),
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-brand-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-black">Booking Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="w-28 shrink-0 font-semibold text-brand-muted">{label}</span>
              <span className="text-brand-black break-all">{value}</span>
            </div>
          ))}
        </div>
        {isActive && (
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={() => { onClose(); onReschedule(booking); }}
              className="flex-1 px-4 py-2 border border-brand-border rounded-xl text-sm font-semibold text-brand-muted hover:bg-brand-surface transition-colors">
              Reschedule
            </button>
            <button onClick={() => { onClose(); onCancel(booking); }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingRecord | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingRecord | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingRecord | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await adminApiFetch(`/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateBooking(id: string, patch: { status?: string; paymentStatus?: string }) {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
    setUpdatingId(id);
    try {
      const res = await adminApiFetch(`/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        toast.success("Booking updated");
      } else {
        toast.error("Failed to update booking");
        fetchBookings();
      }
    } catch { toast.error("Failed to update booking"); fetchBookings(); }
    finally { setUpdatingId(null); }
  }

  async function respondToReschedule(bookingId: string, requestId: string, accept: boolean) {
    setUpdatingId(bookingId);
    try {
      const res = await adminApiFetch(`/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: accept ? undefined : "PENDING" }),
      });
      // For admin, just cancel the pending reschedule request directly
      await adminApiFetch(`/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accept
          ? { scheduledAt: bookings.find(b => b.id === bookingId)?.pendingReschedule?.proposedDateTime }
          : {}),
      });
      if (res.ok) {
        toast.success(accept ? "Reschedule accepted" : "Reschedule declined");
        fetchBookings();
      }
    } catch { toast.error("Failed to respond"); }
    finally { setUpdatingId(null); }
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">Bookings</h2>
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-1.5 text-sm font-bold">
            <CalendarDays className="w-4 h-4" />{total}
          </span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-1 flex-wrap mb-6">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn("px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200",
                statusFilter === tab.value ? "bg-brand-black text-white" : "text-brand-muted hover:text-brand-black")}>
              {tab.label}
            </button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface border-b border-brand-border">
                  {["Reference","Student","Instructor","Date & Time","Type","Amount","Payment","Status","Actions"].map((h, i) => (
                    <th key={h} className={cn("px-4 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide",
                      i === 2 && "hidden md:table-cell",
                      i === 3 && "hidden lg:table-cell",
                      i === 4 && "hidden md:table-cell",
                      i === 5 && "hidden lg:table-cell",
                      i === 8 && "text-right"
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-full max-w-[72px]" /></td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <CalendarDays className="w-10 h-10 text-brand-border mx-auto mb-3" />
                      <p className="text-brand-muted text-sm">No bookings found</p>
                    </td>
                  </tr>
                ) : bookings.map((booking) => {
                  const busy = updatingId === booking.id;
                  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
                  const pr = booking.pendingReschedule;

                  return (
                    <tr key={booking.id} className={cn("hover:bg-brand-surface/50 transition-colors", busy && "opacity-60")}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-mono text-xs text-brand-muted">{booking.reference}</span>
                          {pr && (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              <CalendarClock className="w-2.5 h-2.5" />Reschedule pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-black text-sm leading-tight">{booking.student.name ?? "—"}</p>
                        <p className="text-xs text-brand-muted">{booking.student.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-black hidden md:table-cell">
                        {booking.instructor.user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-brand-black whitespace-nowrap">{formatDate(booking.scheduledAt)}</p>
                        <p className="text-xs text-brand-muted">{formatTime(booking.scheduledAt)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">
                          {LESSON_TYPE_LABELS[booking.lessonType] ?? booking.lessonType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-brand-black hidden lg:table-cell">
                        £{Number(booking.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeDropdown value={booking.paymentStatus} options={PAYMENT_STATUSES}
                          config={PAYMENT_CONFIG} disabled={busy}
                          onChange={(v) => updateBooking(booking.id, { paymentStatus: v })} />
                      </td>
                      <td className="px-4 py-3">
                        <BadgeDropdown value={booking.status} options={BOOKING_STATUSES}
                          config={STATUS_CONFIG} disabled={busy}
                          onChange={(v) => updateBooking(booking.id, { status: v })} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewBooking(booking)}
                            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors" title="View details">
                            <Info className="w-4 h-4" />
                          </button>
                          {pr ? (
                            <>
                              <button onClick={() => respondToReschedule(booking.id, pr.id, true)}
                                disabled={busy}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                                Accept
                              </button>
                              <button onClick={() => respondToReschedule(booking.id, pr.id, false)}
                                disabled={busy}
                                className="text-xs px-2 py-1 border border-red-200 text-brand-red rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                                Decline
                              </button>
                            </>
                          ) : isActive ? (
                            <>
                              <button onClick={() => setRescheduleBooking(booking)}
                                className="text-xs px-2.5 py-1 border border-brand-border text-brand-muted rounded-lg font-medium hover:bg-brand-surface hover:text-brand-black transition-colors">
                                Reschedule
                              </button>
                              <button onClick={() => setCancelBooking(booking)}
                                className="text-xs px-2.5 py-1 border border-red-200 text-brand-red rounded-lg font-medium hover:bg-red-50 transition-colors">
                                Cancel
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
              <p className="text-xs text-brand-muted">Page {page} of {totalPages} · {total} total</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {cancelBooking && (
          <CancelModal
            booking={cancelBooking}
            onClose={() => setCancelBooking(null)}
            onDone={(id, updates) => {
              setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
              setCancelBooking(null);
            }}
          />
        )}
        {rescheduleBooking && (
          <RescheduleModal
            booking={rescheduleBooking}
            onClose={() => setRescheduleBooking(null)}
            onDone={(id, updates) => {
              setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
              setRescheduleBooking(null);
            }}
          />
        )}
        {viewBooking && (
          <BookingDetailsModal
            booking={viewBooking}
            onClose={() => setViewBooking(null)}
            onCancel={(b) => setCancelBooking(b)}
            onReschedule={(b) => setRescheduleBooking(b)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
