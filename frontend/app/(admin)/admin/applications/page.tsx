"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstructorApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  postcode: string;
  hasFullLicence: boolean;
  yearsExperience: number;
  trainingStarted: boolean;
  message: string | null;
  status: string;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-50 text-brand-red border border-red-100",
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

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/applications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleUpdateStatus(id: string, status: "approved" | "rejected") {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch (err) {
      console.error("Failed to update application", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = statusFilter === "pending" ? total : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">
            Instructor Applications
          </h2>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-3 py-1.5 text-sm font-bold">
              <FileText className="w-4 h-4" />
              {pendingCount} pending
            </span>
          )}
        </div>
      </motion.div>

      {/* Status tabs */}
      <motion.div variants={itemVariants} className="flex gap-1 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-all duration-200",
              statusFilter === tab.value
                ? "bg-brand-black text-white font-semibold"
                : "text-brand-muted hover:text-brand-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 animate-pulse"
            >
              <div className="flex justify-between mb-3">
                <div>
                  <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-16" />
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-gray-100 rounded-full w-20" />
                <div className="h-5 bg-gray-100 rounded-full w-24" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-brand-border shadow-sm p-16 text-center"
        >
          <FileText className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm">
            {statusFilter
              ? `No ${statusFilter} applications`
              : "No applications yet"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {applications.map((app) => {
            const badgeClass =
              STATUS_BADGE[app.status] ??
              "bg-gray-100 text-brand-muted border border-gray-200";

            return (
              <motion.div
                key={app.id}
                variants={itemVariants}
                className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col gap-3"
              >
                {/* Top row: name/contact + status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-black text-sm leading-tight">
                      {app.fullName}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {app.email} &middot; {app.phone}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize shrink-0",
                      badgeClass
                    )}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Details chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-brand-muted bg-brand-surface border border-brand-border px-2.5 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {app.postcode}
                  </span>
                  {app.hasFullLicence ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full">
                      Full Licence
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-red-50 text-brand-red border border-red-100 px-2.5 py-0.5 rounded-full">
                      No Licence
                    </span>
                  )}
                  <span className="text-xs text-brand-muted bg-brand-surface border border-brand-border px-2.5 py-0.5 rounded-full">
                    {app.yearsExperience} yr{app.yearsExperience !== 1 ? "s" : ""} exp
                  </span>
                  {app.trainingStarted && (
                    <span className="text-xs text-brand-muted bg-brand-surface border border-brand-border px-2.5 py-0.5 rounded-full">
                      Training Started
                    </span>
                  )}
                </div>

                {/* Optional message */}
                {app.message && (
                  <div className="bg-brand-surface rounded-xl p-3 text-sm text-brand-muted italic">
                    {app.message}
                  </div>
                )}

                {/* Applied date */}
                <p className="text-xs text-brand-muted">
                  Applied {formatDate(app.createdAt)}
                </p>

                {/* Action buttons — only for pending */}
                {app.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(app.id, "approved")}
                      disabled={updatingId === app.id}
                      className="bg-green-600 text-white rounded-xl px-4 py-1.5 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {updatingId === app.id ? "Saving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, "rejected")}
                      disabled={updatingId === app.id}
                      className="border border-red-200 text-brand-red rounded-xl px-4 py-1.5 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="mt-6 flex items-center justify-between"
        >
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
        </motion.div>
      )}
    </motion.div>
  );
}
