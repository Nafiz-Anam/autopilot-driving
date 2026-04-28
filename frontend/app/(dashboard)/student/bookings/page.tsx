"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Clock,
  User,
  RotateCcw,
  XCircle,
  CalendarPlus,
  InboxIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface MockBooking {
  id: string;
  reference: string;
  instructorName: string;
  instructorInitials: string;
  date: string;
  time: string;
  lessonType: string;
  duration: string;
  status: BookingStatus;
  lessonNumber: number;
  withinCancellationWindow: boolean; // true = within 24hrs, cannot cancel
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockBookings: MockBooking[] = [
  {
    id: "b1",
    reference: "APS-AB1234",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Mon 5 May 2025",
    time: "10:00am",
    lessonType: "Manual Lesson",
    duration: "1 hour",
    status: "CONFIRMED",
    lessonNumber: 5,
    withinCancellationWindow: false,
  },
  {
    id: "b2",
    reference: "APS-CD5678",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Sat 10 May 2025",
    time: "2:00pm",
    lessonType: "Mock Test Prep",
    duration: "2 hours",
    status: "CONFIRMED",
    lessonNumber: 6,
    withinCancellationWindow: true,
  },
  {
    id: "b3",
    reference: "APS-EF9012",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Wed 30 Apr 2025",
    time: "2:00pm",
    lessonType: "Manual Lesson",
    duration: "1 hour",
    status: "COMPLETED",
    lessonNumber: 4,
    withinCancellationWindow: false,
  },
  {
    id: "b4",
    reference: "APS-GH3456",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Mon 28 Apr 2025",
    time: "10:00am",
    lessonType: "Manual Lesson",
    duration: "1 hour",
    status: "COMPLETED",
    lessonNumber: 3,
    withinCancellationWindow: false,
  },
  {
    id: "b5",
    reference: "APS-IJ7890",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Thu 24 Apr 2025",
    time: "9:00am",
    lessonType: "Manual Lesson",
    duration: "1 hour",
    status: "COMPLETED",
    lessonNumber: 2,
    withinCancellationWindow: false,
  },
  {
    id: "b6",
    reference: "APS-KL1122",
    instructorName: "James Williams",
    instructorInitials: "JW",
    date: "Mon 21 Apr 2025",
    time: "10:00am",
    lessonType: "Manual Lesson",
    duration: "1 hour",
    status: "CANCELLED",
    lessonNumber: 1,
    withinCancellationWindow: false,
  },
];

// ─── Status config ─────────────────────────────────────────────────────────────
const statusConfig: Record<BookingStatus, { label: string; classes: string }> =
  {
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
  };

// ─── Animation ────────────────────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-brand-muted">
      <InboxIcon className="w-10 h-10 text-brand-border" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────
function BookingRow({ booking }: { booking: MockBooking }) {
  const [cancelState, setCancelState] = useState<
    "idle" | "confirming" | "cancelled"
  >("idle");
  const cfg = statusConfig[booking.status];

  const isCancelled = cancelState === "cancelled";
  const displayStatus: BookingStatus = isCancelled ? "CANCELLED" : booking.status;
  const displayCfg = statusConfig[displayStatus];

  return (
    <motion.div
      variants={rowVariants}
      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-brand-border last:border-b-0 hover:bg-brand-surface/40 transition-colors"
    >
      {/* Instructor avatar */}
      <div className="shrink-0 w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold">
        {booking.instructorInitials}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-brand-black">
            {booking.lessonType}
          </p>
          <span className="text-xs text-brand-muted">&middot; {booking.reference}</span>
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full",
              cfg.classes
            )}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {booking.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {booking.time}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {booking.instructorName}
          </span>
        </div>
      </div>

      {/* Duration badge */}
      <span className="shrink-0 text-xs font-medium text-brand-muted border border-brand-border px-2.5 py-1 rounded-lg">
        {booking.duration}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {booking.status === "CONFIRMED" && !isCancelled && (
          <>
            <button
              onClick={() => void 0}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-muted border border-brand-border px-3 py-1.5 rounded-lg hover:bg-brand-surface transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to Calendar
            </button>
            {cancelState === "confirming" ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCancelState("cancelled")}
                  className="text-xs font-semibold text-white bg-brand-red px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setCancelState("idle")}
                  className="text-xs font-medium text-brand-muted px-2 py-1.5"
                >
                  Back
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  booking.withinCancellationWindow
                    ? undefined
                    : setCancelState("confirming")
                }
                disabled={booking.withinCancellationWindow}
                title={
                  booking.withinCancellationWindow
                    ? "Cannot cancel within 24 hours of lesson"
                    : "Cancel this booking"
                }
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                  booking.withinCancellationWindow
                    ? "border-brand-border text-brand-border cursor-not-allowed opacity-50"
                    : "border-red-200 text-brand-red hover:bg-red-50"
                )}
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </>
        )}
        {booking.status === "COMPLETED" && (
          <button className="flex items-center gap-1.5 text-xs font-semibold text-brand-red border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Book Again
          </button>
        )}
        {(booking.status === "CANCELLED" || isCancelled) && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full",
              displayCfg.classes
            )}
          >
            {displayCfg.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Booking list ─────────────────────────────────────────────────────────────
function BookingList({
  bookings,
  emptyMessage,
}: {
  bookings: MockBooking[];
  emptyMessage: string;
}) {
  if (bookings.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      {bookings.map((b) => (
        <BookingRow key={b.id} booking={b} />
      ))}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentBookingsPage() {
  useSession();
  const upcoming = mockBookings.filter((b) => b.status === "CONFIRMED");
  const past = mockBookings.filter((b) => b.status === "COMPLETED");
  const cancelled = mockBookings.filter((b) => b.status === "CANCELLED");

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-extrabold text-brand-black">
          My Bookings
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Manage and view all your driving lessons.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
      >
        <Tabs defaultValue="upcoming">
          <div className="px-5 pt-4 border-b border-brand-border">
            <TabsList className="bg-brand-surface gap-1">
              <TabsTrigger value="upcoming" className="gap-1.5 text-sm">
                Upcoming
                {upcoming.length > 0 && (
                  <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {upcoming.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="text-sm">
                Past ({past.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-sm">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent key="upcoming" value="upcoming" className="mt-0 pt-2">
              <BookingList
                bookings={upcoming}
                emptyMessage="No upcoming lessons — book one to get started!"
              />
            </TabsContent>
            <TabsContent key="past" value="past" className="mt-0 pt-2">
              <BookingList
                bookings={past}
                emptyMessage="No completed lessons yet."
              />
            </TabsContent>
            <TabsContent key="cancelled" value="cancelled" className="mt-0 pt-2">
              <BookingList
                bookings={cancelled}
                emptyMessage="No cancelled bookings."
              />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
