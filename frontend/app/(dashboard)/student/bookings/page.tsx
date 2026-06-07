"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  InboxIcon,
  RotateCcw,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING" | "NO_SHOW";

interface Booking {
  id: string;
  reference: string;
  lessonType: string;
  transmission: string;
  scheduledAt: string;
  durationMins: number;
  status: BookingStatus;
  paymentStatus: string;
  totalAmount: number;
  instructor: {
    user: { name: string | null; image: string | null };
    rating: number;
    areas: string[];
  };
}

const STATUS_TABS = [
  { value: "ALL",       label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PENDING",   label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW",   label: "No Show" },
];

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  CONFIRMED: { label: "Confirmed", classes: "bg-green-100 text-green-700 border border-green-200" },
  PENDING:   { label: "Pending",   classes: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  COMPLETED: { label: "Completed", classes: "bg-gray-100 text-brand-muted border border-gray-200" },
  CANCELLED: { label: "Cancelled", classes: "bg-red-50 text-brand-red border border-red-100" },
  NO_SHOW:   { label: "No Show",   classes: "bg-orange-50 text-orange-700 border border-orange-100" },
};

const PAYMENT_CONFIG: Record<string, string> = {
  PAID:     "bg-green-100 text-green-700 border border-green-200",
  UNPAID:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
  REFUNDED: "bg-gray-100 text-brand-muted border border-gray-200",
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  MANUAL:    "Manual",
  AUTOMATIC: "Auto",
  INTENSIVE: "Intensive",
  MOTORWAY:  "Motorway",
  PASS_PLUS: "Pass Plus",
  REFRESHER: "Refresher",
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

function isWithin24h(scheduledAt: string) {
  return new Date(scheduledAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

interface CancelModal {
  bookingId: string;
  scheduledAt: string;
}

const CANCEL_REASONS = [
  "Change of plans",
  "Found another instructor",
  "Personal emergency",
  "Illness",
  "Work or school commitment",
  "Financial reasons",
  "Other",
];

export default function StudentBookingsPage() {
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cancelModal, setCancelModal]   = useState<CancelModal | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [otherReason, setOtherReason]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [cancelError, setCancelError]   = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl("/bookings"), { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data ?? []);
      }
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  function openCancelModal(booking: Booking) {
    setCancelModal({ bookingId: booking.id, scheduledAt: booking.scheduledAt });
    setCancelReason("");
    setOtherReason("");
    setCancelError("");
  }

  function closeCancelModal() {
    if (submitting) return;
    setCancelModal(null);
    setCancelReason("");
    setOtherReason("");
    setCancelError("");
  }

  async function handleCancel() {
    if (!cancelModal) return;
    const finalReason = cancelReason === "Other" ? otherReason.trim() : cancelReason;
    if (!finalReason) {
      setCancelError("Please select or enter a reason.");
      return;
    }

    setSubmitting(true);
    setCancelError("");
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl(`/bookings/${cancelModal.bookingId}`), {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: finalReason }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === cancelModal.bookingId ? { ...b, status: "CANCELLED" as BookingStatus } : b
          )
        );
        closeCancelModal();
      } else {
        const body = await res.json().catch(() => ({}));
        setCancelError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = statusFilter === "ALL"
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">My Bookings</h2>
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-1.5 text-sm font-bold">
            <CalendarDays className="w-4 h-4" />
            {bookings.length}
          </span>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200",
              statusFilter === tab.value
                ? "bg-brand-black text-white"
                : "text-brand-muted hover:text-brand-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border">
                {[
                  { label: "Reference",   cls: "" },
                  { label: "Instructor",  cls: "hidden md:table-cell" },
                  { label: "Date & Time", cls: "hidden lg:table-cell" },
                  { label: "Type",        cls: "hidden md:table-cell" },
                  { label: "Duration",    cls: "hidden lg:table-cell" },
                  { label: "Amount",      cls: "hidden lg:table-cell" },
                  { label: "Payment",     cls: "hidden sm:table-cell" },
                  { label: "Status",      cls: "" },
                  { label: "Actions",     cls: "text-right" },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={cn(
                      "px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide",
                      h.cls
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-full max-w-[72px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">
                      {statusFilter !== "ALL"
                        ? `No ${statusFilter.toLowerCase()} bookings found`
                        : "No bookings yet — book a lesson to get started!"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const sc = STATUS_CONFIG[booking.status] ?? {
                    label: booking.status,
                    classes: "bg-gray-100 text-brand-muted border border-gray-200",
                  };
                  const pc = PAYMENT_CONFIG[booking.paymentStatus] ?? "bg-gray-100 text-brand-muted border border-gray-200";
                  const typeLabel = LESSON_TYPE_LABELS[booking.lessonType] ?? booking.lessonType;
                  const isUpcoming = booking.status === "CONFIRMED" || booking.status === "PENDING";

                  return (
                    <tr key={booking.id} className="hover:bg-brand-surface/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-brand-muted">{booking.reference}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-black hidden md:table-cell">
                        {booking.instructor.user.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-brand-black whitespace-nowrap">{formatDate(booking.scheduledAt)}</p>
                        <p className="text-xs text-brand-muted">{formatTime(booking.scheduledAt)}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-muted hidden lg:table-cell">
                        {booking.durationMins / 60}hr
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-brand-black hidden lg:table-cell">
                        £{Number(booking.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", pc)}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", sc.classes)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUpcoming && (
                            <button
                              onClick={() => {
                                const dt = new Date(booking.scheduledAt);
                                const end = new Date(dt.getTime() + booking.durationMins * 60000);
                                const fmt = (d: Date) =>
                                  d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
                                window.open(
                                  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.lessonType)}&dates=${fmt(dt)}/${fmt(end)}`,
                                  "_blank"
                                );
                              }}
                              className="flex items-center gap-1 text-xs font-medium text-brand-muted border border-brand-border px-2.5 py-1 rounded-lg hover:bg-brand-surface transition-colors"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span className="hidden sm:inline">Calendar</span>
                            </button>
                          )}
                          {isUpcoming && (
                            <button
                              onClick={() => openCancelModal(booking)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-brand-red hover:bg-red-50 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === "COMPLETED" && (
                            <a
                              href="/book"
                              className="flex items-center gap-1 text-xs font-semibold text-brand-red border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Book Again
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      {/* Cancellation modal */}
      <AnimatePresence>
        {cancelModal && (() => {
          const within24h = isWithin24h(cancelModal.scheduledAt);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
              onClick={(e) => { if (e.target === e.currentTarget) closeCancelModal(); }}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-brand-black">Cancel Booking</h3>
                    <p className="text-sm text-brand-muted mt-0.5">Please tell us why you&apos;re cancelling.</p>
                  </div>
                  <button
                    onClick={closeCancelModal}
                    disabled={submitting}
                    className="text-brand-muted hover:text-brand-black transition-colors ml-4 mt-0.5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Refund notice */}
                <div className={cn(
                  "rounded-xl px-4 py-3 mb-5 flex gap-3 text-sm",
                  within24h
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-green-50 border border-green-200 text-green-800"
                )}>
                  <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", within24h ? "text-amber-500" : "text-green-500")} />
                  <span>
                    {within24h
                      ? "Your lesson is within 24 hours. No refund will be issued for this cancellation."
                      : "Your lesson is more than 24 hours away. A full refund will be automatically issued."}
                  </span>
                </div>

                {/* Reason picker */}
                <div className="space-y-2 mb-4">
                  {CANCEL_REASONS.map((r) => (
                    <label
                      key={r}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors",
                        cancelReason === r
                          ? "border-brand-black bg-brand-surface text-brand-black font-medium"
                          : "border-brand-border text-brand-muted hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={r}
                        checked={cancelReason === r}
                        onChange={() => { setCancelReason(r); setCancelError(""); }}
                        className="accent-brand-black"
                      />
                      {r}
                    </label>
                  ))}
                </div>

                {/* Free-text if "Other" */}
                {cancelReason === "Other" && (
                  <textarea
                    ref={reasonRef}
                    value={otherReason}
                    onChange={(e) => { setOtherReason(e.target.value); setCancelError(""); }}
                    placeholder="Please describe your reason…"
                    rows={3}
                    className="w-full border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-black placeholder:text-brand-muted focus:outline-none focus:border-brand-black resize-none mb-4"
                  />
                )}

                {/* Error */}
                {cancelError && (
                  <p className="text-sm text-brand-red mb-3">{cancelError}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={closeCancelModal}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-black transition-colors disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Cancelling…" : "Confirm Cancel"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
