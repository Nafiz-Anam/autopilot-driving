"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  InboxIcon,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function StudentBookingsPage() {
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
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

  function handleCancelled(id: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" as BookingStatus } : b))
    );
    setConfirmCancelId(null);
  }

  async function handleCancel(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) handleCancelled(id);
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
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
                  const withinWindow = isWithin24h(booking.scheduledAt);

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
                          {isUpcoming &&
                            (confirmCancelId === booking.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-brand-muted">Cancel?</span>
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={updatingId === booking.id}
                                  className="text-xs px-2.5 py-1 bg-brand-red text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {updatingId === booking.id ? "…" : "Yes"}
                                </button>
                                <button
                                  onClick={() => setConfirmCancelId(null)}
                                  className="text-xs text-brand-muted hover:text-brand-black transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => !withinWindow && setConfirmCancelId(booking.id)}
                                disabled={withinWindow}
                                title={withinWindow ? "Cannot cancel within 24 hours of lesson" : "Cancel this booking"}
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors",
                                  withinWindow
                                    ? "border-brand-border text-brand-border cursor-not-allowed opacity-50"
                                    : "border-red-200 text-brand-red hover:bg-red-50"
                                )}
                              >
                                Cancel
                              </button>
                            ))}
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
    </motion.div>
  );
}
