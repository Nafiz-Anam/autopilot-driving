"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  CONFIRMED: {
    label: "Confirmed",
    classes: "bg-green-100 text-green-700 border border-green-200",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-gray-100 text-brand-muted border border-gray-200",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-red-50 text-brand-red border border-red-100",
  },
  PENDING: {
    label: "Pending",
    classes: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
  NO_SHOW: {
    label: "No Show",
    classes: "bg-orange-50 text-orange-700 border border-orange-100",
  },
};

const PAYMENT_CONFIG: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border border-green-200",
  UNPAID: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  REFUNDED: "bg-gray-100 text-brand-muted border border-gray-200",
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Auto",
  INTENSIVE: "Intensive",
  MOTORWAY: "Motorway",
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
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancelBooking(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b))
        );
      }
    } catch (err) {
      console.error("Failed to cancel booking", err);
    } finally {
      setUpdatingId(null);
      setConfirmCancelId(null);
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">Bookings</h2>
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-1.5 text-sm font-bold">
            <CalendarDays className="w-4 h-4" />
            {total}
          </span>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Reference
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Student
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Instructor
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Date &amp; Time
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell">
                  Type
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Duration
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell">
                  Payment
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded w-full max-w-[72px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <CalendarDays className="w-10 h-10 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">
                      {statusFilter
                        ? `No ${statusFilter.toLowerCase()} bookings found`
                        : "No bookings found"}
                    </p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const sc =
                    STATUS_CONFIG[booking.status] ?? {
                      label: booking.status,
                      classes: "bg-gray-100 text-brand-muted border border-gray-200",
                    };
                  const pc =
                    PAYMENT_CONFIG[booking.paymentStatus] ??
                    "bg-gray-100 text-brand-muted border border-gray-200";
                  const typeLabel =
                    LESSON_TYPE_LABELS[booking.lessonType] ?? booking.lessonType;
                  const canCancel =
                    booking.status === "PENDING" || booking.status === "CONFIRMED";

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-brand-surface/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-brand-muted">
                          {booking.reference}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-brand-black text-sm leading-tight">
                          {booking.student.name ?? "—"}
                        </p>
                        <p className="text-xs text-brand-muted">{booking.student.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-brand-black hidden md:table-cell">
                        {booking.instructor.user.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-sm text-brand-black whitespace-nowrap">
                          {formatDate(booking.scheduledAt)}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {formatTime(booking.scheduledAt)}
                        </p>
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
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full",
                            pc
                          )}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2.5 py-1 rounded-full",
                            sc.classes
                          )}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {canCancel &&
                          booking.status !== "CANCELLED" &&
                          (confirmCancelId === booking.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-brand-muted">Cancel?</span>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
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
                              onClick={() => setConfirmCancelId(booking.id)}
                              className="text-xs px-2.5 py-1 text-brand-red border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-xs text-brand-muted">
              Page {page} of {totalPages} &middot; {total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-black hover:bg-brand-surface transition-colors disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
