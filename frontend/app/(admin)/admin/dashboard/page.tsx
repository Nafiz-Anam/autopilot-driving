"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  CalendarDays,
  PoundSterling,
  FileText,
  MessageSquare,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalInstructors: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApplications: number;
  newContactsToday: number;
  bookingsThisMonth: number;
  activeAreas: number;
}

interface RecentBooking {
  id: string;
  reference: string;
  status: string;
  lessonType: string;
  scheduledAt: string;
  totalAmount: number;
  student: { name: string | null };
  instructor: { user: { name: string | null } };
}

interface RecentApplication {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
  phone: string;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-20 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "bg-brand-red",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col gap-3"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-brand-black leading-none mb-1">{value}</p>
        <p className="text-sm text-brand-muted">{label}</p>
      </div>
    </motion.div>
  );
}

const statusConfig: Record<string, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
  CONFIRMED: { label: "Confirmed", classes: "bg-green-100 text-green-700", icon: CheckCircle },
  COMPLETED: { label: "Completed", classes: "bg-gray-100 text-brand-muted", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", classes: "bg-red-50 text-brand-red", icon: XCircle },
  PENDING: { label: "Pending", classes: "bg-yellow-50 text-yellow-700", icon: Clock },
  NO_SHOW: { label: "No Show", classes: "bg-orange-50 text-orange-700", icon: AlertCircle },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(amount: number) {
  return `£${amount.toFixed(2)}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [appActions, setAppActions] = useState<Record<string, "approving" | "rejecting" | null>>({});

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/admin/bookings?page=1")
      .then((r) => r.json())
      .then((d) => setRecentBookings((d.data ?? []).slice(0, 5)))
      .catch(() => {});

    fetch("/api/admin/applications?status=pending&page=1")
      .then((r) => r.json())
      .then((d) => setRecentApplications((d.data ?? []).slice(0, 5)))
      .catch(() => {});
  }, []);

  async function handleApplicationAction(id: string, action: "approved" | "rejected") {
    setAppActions((prev) => ({ ...prev, [id]: action === "approved" ? "approving" : "rejecting" }));
    try {
      await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      setRecentApplications((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently fail
    } finally {
      setAppActions((prev) => ({ ...prev, [id]: null }));
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-black">Admin Dashboard</h1>
        <p className="text-brand-muted mt-1 text-sm">{today}</p>
      </motion.div>

      {/* Stats row 1 */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} accent="bg-blue-500" />
          <StatCard icon={GraduationCap} label="Active Instructors" value={stats?.totalInstructors ?? 0} accent="bg-brand-red" />
          <StatCard icon={CalendarDays} label="Total Bookings" value={stats?.totalBookings ?? 0} accent="bg-brand-orange" />
          <StatCard
            icon={PoundSterling}
            label="Total Revenue"
            value={`£${(stats?.totalRevenue ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            accent="bg-green-600"
          />
        </div>
      )}

      {/* Stats row 2 */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="This Month Bookings" value={stats?.bookingsThisMonth ?? 0} accent="bg-purple-500" />
          <StatCard icon={FileText} label="Pending Applications" value={stats?.pendingApplications ?? 0} accent="bg-yellow-500" />
          <StatCard icon={MessageSquare} label="Contacts Today" value={stats?.newContactsToday ?? 0} accent="bg-teal-500" />
          <StatCard icon={MapPin} label="Active Areas" value={stats?.activeAreas ?? 0} accent="bg-brand-black" />
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-bold text-brand-black flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-brand-red" />
              Recent Bookings
            </h3>
            <a href="/admin/bookings" className="text-xs text-brand-red hover:text-brand-orange font-semibold transition-colors">
              View all &rarr;
            </a>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-32 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-48" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="w-8 h-8 text-brand-border mx-auto mb-2" />
              <p className="text-sm text-brand-muted">No bookings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {recentBookings.map((booking) => {
                const cfg = statusConfig[booking.status] ?? statusConfig.PENDING;
                return (
                  <div key={booking.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-brand-surface/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                      {(booking.student.name ?? "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-mono text-brand-muted">{booking.reference}</p>
                        <p className="text-sm font-semibold text-brand-black truncate">{booking.student.name ?? "Unknown"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs font-medium bg-brand-surface text-brand-muted px-1.5 py-0.5 rounded">
                          {booking.lessonType}
                        </span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.classes)}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-brand-muted">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pending Applications */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-bold text-brand-black flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-brand-red" />
              Pending Applications
            </h3>
            <a href="/admin/applications" className="text-xs text-brand-red hover:text-brand-orange font-semibold transition-colors">
              View all &rarr;
            </a>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse p-3 rounded-xl bg-gray-50">
                  <div className="h-3 bg-gray-100 rounded w-32 mb-1.5" />
                  <div className="h-2.5 bg-gray-100 rounded w-48 mb-2" />
                  <div className="flex gap-2">
                    <div className="h-7 bg-gray-100 rounded w-16" />
                    <div className="h-7 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-brand-border mx-auto mb-2" />
              <p className="text-sm text-brand-muted">No pending applications</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {recentApplications.map((app) => (
                <div key={app.id} className="px-6 py-4 hover:bg-brand-surface/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange text-xs font-bold shrink-0 mt-0.5">
                      {app.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-black truncate">{app.fullName}</p>
                      <p className="text-xs text-brand-muted truncate">{app.email}</p>
                      <p className="text-xs text-brand-muted mt-0.5">Applied {formatDate(app.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleApplicationAction(app.id, "approved")}
                          disabled={!!appActions[app.id]}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {appActions[app.id] === "approving" ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, "rejected")}
                          disabled={!!appActions[app.id]}
                          className="text-xs px-3 py-1.5 border border-brand-border rounded-lg font-medium hover:bg-brand-surface transition-colors disabled:opacity-50 text-brand-muted"
                        >
                          {appActions[app.id] === "rejecting" ? "..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
