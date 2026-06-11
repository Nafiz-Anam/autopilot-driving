"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, InboxIcon, X, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

interface PendingReschedule {
  id: string;
  requestedByRole: string;
  requesterName: string | null;
  proposedDateTime: string;
  reason: string | null;
}

interface Booking {
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
  pendingReschedule?: PendingReschedule | null;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  CONFIRMED: { label: "Confirmed", classes: "bg-green-100 text-green-700 border border-green-200" },
  PENDING:   { label: "Pending",   classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  COMPLETED: { label: "Completed", classes: "bg-gray-100 text-brand-muted border border-gray-200" },
  CANCELLED: { label: "Cancelled", classes: "bg-red-50 text-brand-red border border-red-100" },
  NO_SHOW:   { label: "No Show",   classes: "bg-orange-50 text-orange-700 border border-orange-100" },
};

const PAYMENT_CONFIG: Record<string, string> = {
  PAID:           "bg-green-100 text-green-700 border border-green-200",
  UNPAID:         "bg-yellow-50 text-yellow-700 border border-yellow-200",
  REFUNDED:       "bg-gray-100 text-brand-muted border border-gray-200",
  PARTIAL_REFUND: "bg-blue-50 text-blue-600 border border-blue-200",
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Manual", AUTOMATIC: "Auto", INTENSIVE: "Intensive",
  MOTORWAY: "Motorway", PASS_PLUS: "Pass Plus", REFRESHER: "Refresher", THEORY: "Theory",
};

const CANCEL_REASONS = ["Personal emergency", "Illness", "Vehicle breakdown", "Weather conditions", "Double booking", "Other"];
const RESCHEDULE_REASONS = ["Personal emergency", "Illness", "Vehicle issue", "Weather conditions", "Scheduling conflict", "Other"];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function hoursUntil(scheduledAt: string) {
  return (new Date(scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
}
function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ booking, onClose, onCancelled }: {
  booking: Booking; onClose: () => void; onCancelled: (id: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const hrs = hoursUntil(booking.scheduledAt);
  const isLate = hrs < 24;

  async function submit() {
    if (!reason) { setErr("Please select a reason."); return; }
    if (!acknowledged) { setErr("Please acknowledge the cancellation policy."); return; }
    setSaving(true);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl(`/instructor/bookings/${booking.id}/cancel`), {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes: notes || undefined }),
      });
      if (res.ok) {
        onCancelled(booking.id);
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? "Failed to cancel booking.");
      }
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-brand-black text-lg">Cancel This Lesson</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {isLate && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-orange-800">
              Late cancellation — this is within 24 hours of the lesson. This will be recorded against your reliability rating.
            </div>
          )}
          <div className="bg-brand-surface rounded-xl p-3 text-sm">
            <p className="font-semibold text-brand-black">{booking.student.name ?? booking.student.email}</p>
            <p className="text-brand-muted text-xs">{formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}</p>
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
              placeholder="Any additional context for the student..." />
          </div>
          <label className="flex items-start gap-3 p-3 bg-brand-surface rounded-xl border border-brand-border cursor-pointer">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-brand-red shrink-0" />
            <p className="text-xs text-brand-black">
              I understand this cancellation will be recorded against my profile and the student will be notified immediately.
            </p>
          </label>
          {err && <p className="text-xs text-brand-red">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-black transition-colors">
            Go Back
          </button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
            {saving ? "Cancelling…" : "Cancel Lesson"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reschedule Request Modal ──────────────────────────────────────────────────
function RescheduleModal({ booking, onClose, onRequested }: {
  booking: Booking; onClose: () => void; onRequested: () => void;
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
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl(`/instructor/bookings/${booking.id}/reschedule`), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedDateTime: new Date(newDateTime).toISOString(),
          reason,
          notes: notes || undefined,
        }),
      });
      if (res.ok) {
        onRequested();
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? "Failed to send reschedule request.");
      }
    } catch { setErr("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-brand-black text-lg">Request Reschedule</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
            The student will be notified and can accept or decline the new time. The lesson is not affected until they respond.
          </div>
          <div className="bg-brand-surface rounded-xl p-3 text-sm">
            <p className="font-semibold text-brand-black">{booking.student.name ?? booking.student.email}</p>
            <p className="text-brand-muted text-xs">Currently: {formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-black mb-1.5 block">Proposed Date & Time <span className="text-brand-red">*</span></label>
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
              placeholder="Any additional context for the student..." />
          </div>
          {err && <p className="text-xs text-brand-red">{err}</p>}
        </div>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-black transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="px-4 py-2 bg-brand-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? "Sending…" : "Send Request"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function InstructorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl(`/instructor/bookings?${params}`), { headers });
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

  async function handleRescheduleResponse(booking: Booking, requestId: string, accept: boolean) {
    setUpdatingId(booking.id);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl(`/instructor/bookings/${booking.id}/reschedule`), {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, accept }),
      });
      if (res.ok) fetchBookings();
    } catch { /* ignore */ }
    finally { setUpdatingId(null); }
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">My Bookings</h2>
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
                  {[
                    { label: "Reference", cls: "" },
                    { label: "Student",   cls: "" },
                    { label: "Date & Time", cls: "hidden lg:table-cell" },
                    { label: "Type",       cls: "hidden md:table-cell" },
                    { label: "Duration",   cls: "hidden lg:table-cell" },
                    { label: "Amount",     cls: "hidden lg:table-cell" },
                    { label: "Payment",    cls: "hidden sm:table-cell" },
                    { label: "Status",     cls: "" },
                    { label: "Actions",    cls: "text-right" },
                  ].map((h) => (
                    <th key={h.label} className={cn("px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide", h.cls)}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-3 bg-gray-100 rounded w-full max-w-[72px]" /></td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3" />
                      <p className="text-brand-muted text-sm">No bookings found</p>
                    </td>
                  </tr>
                ) : bookings.map((booking) => {
                  const sc = STATUS_CONFIG[booking.status] ?? { label: booking.status, classes: "bg-gray-100 text-brand-muted border border-gray-200" };
                  const pc = PAYMENT_CONFIG[booking.paymentStatus] ?? "bg-gray-100 text-brand-muted border border-gray-200";
                  const typeLabel = LESSON_TYPE_LABELS[booking.lessonType] ?? booking.lessonType;
                  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
                  const busy = updatingId === booking.id;
                  const pr = booking.pendingReschedule;
                  // Reschedule requested by the student is "action required" for the instructor
                  const actionRequired = pr && pr.requestedByRole === "STUDENT";

                  return (
                    <tr key={booking.id} className={cn("hover:bg-brand-surface/50 transition-colors", busy && "opacity-60")}>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-mono text-xs text-brand-muted">{booking.reference}</span>
                          {actionRequired && (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              <CalendarClock className="w-2.5 h-2.5" />Action required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-brand-black text-sm leading-tight">{booking.student.name ?? "—"}</p>
                        <p className="text-xs text-brand-muted">{booking.student.email}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-brand-black whitespace-nowrap">{formatDate(booking.scheduledAt)}</p>
                        <p className="text-xs text-brand-muted">{formatTime(booking.scheduledAt)}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">{typeLabel}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted hidden lg:table-cell">{booking.durationMins / 60}hr</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-brand-black hidden lg:table-cell">
                        £{Number(booking.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", pc)}>
                          {booking.paymentStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", sc.classes)}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {actionRequired && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-amber-700 font-medium hidden sm:block">
                                → {formatDate(pr.proposedDateTime)}
                              </span>
                              <button onClick={() => handleRescheduleResponse(booking, pr.id, true)} disabled={busy}
                                className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                                Accept
                              </button>
                              <button onClick={() => handleRescheduleResponse(booking, pr.id, false)} disabled={busy}
                                className="text-xs px-2 py-1 border border-red-200 text-brand-red rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                                Decline
                              </button>
                            </div>
                          )}
                          {isActive && !actionRequired && (
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
                          )}
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
            onCancelled={(id) => {
              setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
              setCancelBooking(null);
            }}
          />
        )}
        {rescheduleBooking && (
          <RescheduleModal
            booking={rescheduleBooking}
            onClose={() => setRescheduleBooking(null)}
            onRequested={() => { setRescheduleBooking(null); fetchBookings(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
