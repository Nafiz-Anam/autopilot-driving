"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  phone: string;
  postcode: string;
  enquiryType: string;
  callTime: string | null;
  message: string;
  createdAt: string;
}

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

function ContactCard({
  submission,
  onDelete,
}: {
  submission: ContactSubmission;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const longMessage = submission.message.length > 120;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl border border-brand-border shadow-sm p-5"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className="font-bold text-brand-black text-sm">{submission.name}</h3>
            <span className="text-xs text-brand-muted">{submission.phone}</span>
            <span className="text-xs text-brand-muted">{submission.postcode}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-brand-muted whitespace-nowrap hidden sm:block">
            {formatDate(submission.createdAt)}
          </span>
          <button
            onClick={() => onDelete(submission.id)}
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-red hover:bg-red-50 transition-colors"
            title="Delete submission"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enquiry type + call time row */}
      <div className="flex items-center flex-wrap gap-2 mt-2 mb-3">
        <span className="text-[11px] font-semibold bg-brand-surface text-brand-muted border border-brand-border px-2.5 py-0.5 rounded-full">
          {submission.enquiryType}
        </span>
        {submission.callTime && (
          <span className="text-xs text-brand-muted">
            Best time: {submission.callTime}
          </span>
        )}
        <span className="text-xs text-brand-muted sm:hidden">
          {formatDate(submission.createdAt)}
        </span>
      </div>

      {/* Message preview / expanded */}
      {expanded ? (
        <div className="bg-brand-surface rounded-xl p-3 text-sm text-brand-muted leading-relaxed">
          {submission.message}
        </div>
      ) : (
        <p className="text-sm text-brand-muted leading-relaxed">
          {longMessage ? submission.message.slice(0, 120) + "…" : submission.message}
        </p>
      )}

      {/* Show more / less toggle */}
      {longMessage && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-red hover:text-brand-orange transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show more
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function fetchSubmissions(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch contact submissions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions(page);
  }, [page]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this submission? This cannot be undone."
    );
    if (!confirmed) return;
    const res = await fetch(`/api/admin/contact/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-black">
            Contact Submissions
          </h2>
          <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-100 text-brand-red rounded-xl px-3 py-1.5 text-sm font-bold">
            <MessageSquare className="w-4 h-4" />
            {total} total
          </span>
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 animate-pulse"
            >
              <div className="flex justify-between mb-3">
                <div className="flex gap-3">
                  <div className="h-4 bg-gray-100 rounded w-28" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-gray-100 rounded-full w-24" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-brand-border shadow-sm p-16 text-center"
        >
          <MessageSquare className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm">No contact submissions yet</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {submissions.map((sub) => (
            <ContactCard key={sub.id} submission={sub} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="mt-6 flex items-center justify-between"
        >
          <p className="text-xs text-brand-muted">
            Page {page} of {totalPages}
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
