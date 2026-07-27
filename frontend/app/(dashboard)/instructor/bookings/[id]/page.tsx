"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, CalendarDays, Clock, InboxIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { instructorApiFetch } from "@/lib/instructor-api";
import {
  CompetencyLevel,
  CompetencyLevelControl,
} from "@/components/progress/CompetencyLevelControl";

interface ScoreEntry {
  skillId: string;
  skillKey: string;
  skillName: string;
  level: CompetencyLevel | null;
  note: string | null;
}

interface ReportData {
  exists: boolean;
  id: string | null;
  bookingId: string;
  published: boolean;
  publishedAt: string | null;
  overallNotes: string | null;
  updatedAt: string | null;
  booking: { id: string; scheduledAt: string; status: string; lessonType: string };
  scores: ScoreEntry[];
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Manual", AUTOMATIC: "Auto", INTENSIVE: "Intensive",
  MOTORWAY: "Motorway", PASS_PLUS: "Pass Plus", REFRESHER: "Refresher", THEORY: "Theory",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function InstructorProgressReportPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [levels, setLevels] = useState<Record<string, CompetencyLevel>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"publish" | "unpublish" | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await instructorApiFetch(`/bookings/${bookingId}/progress-report`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const json = await res.json();
      const data: ReportData = json.data;
      setReport(data);
      setLevels(
        Object.fromEntries(data.scores.map((s) => [s.skillId, s.level ?? "NOT_COVERED"]))
      );
      setNotes(Object.fromEntries(data.scores.map((s) => [s.skillId, s.note ?? ""])));
      setOverallNotes(data.overallNotes ?? "");
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  async function saveDraft() {
    if (!report) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await instructorApiFetch(`/bookings/${bookingId}/progress-report`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallNotes: overallNotes || undefined,
          scores: report.scores.map((s) => ({
            skillId: s.skillId,
            level: levels[s.skillId] ?? "NOT_COVERED",
            note: notes[s.skillId] || undefined,
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "Failed to save draft.");
        return;
      }
      setReport(json.data);
      setSavedMessage("Draft saved.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(action: "publish" | "unpublish") {
    setPublishing(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = await instructorApiFetch(`/bookings/${bookingId}/progress-report/${action}`, {
        method: "PATCH",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? `Failed to ${action} report.`);
        return;
      }
      setReport(json.data);
      setSavedMessage(action === "publish" ? "Report published — the student can now see it." : "Report unpublished.");
    } catch {
      setError("Network error.");
    } finally {
      setPublishing(false);
      setConfirmAction(null);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3 animate-pulse" />
        <p className="text-brand-muted text-sm">Loading progress report…</p>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="py-16 text-center">
        <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3" />
        <p className="text-brand-muted text-sm mb-4">Booking not found or you don&apos;t have access to it.</p>
        <Link href="/instructor/bookings" className="text-sm font-semibold text-brand-red hover:underline">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const isCompleted = report.booking.status === "COMPLETED";
  const typeLabel = LESSON_TYPE_LABELS[report.booking.lessonType] ?? report.booking.lessonType;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/instructor/bookings" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-black mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Bookings
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-brand-black mb-1">Progress Report</h2>
          <div className="flex items-center gap-3 text-sm text-brand-muted">
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(report.booking.scheduledAt)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(report.booking.scheduledAt)}</span>
            <span className="text-xs border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">{typeLabel}</span>
          </div>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full border",
          report.published ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-brand-muted border-gray-200"
        )}>
          {report.published ? "Published" : "Draft"}
        </span>
      </div>

      {!isCompleted && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-800 mb-6">
          This lesson isn&apos;t marked as completed yet. Progress reports can only be created once the lesson is completed.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-brand-border">
          {report.scores.map((score) => (
            <div key={score.skillId} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="font-semibold text-brand-black text-sm min-w-[180px]">{score.skillName}</p>
              <CompetencyLevelControl
                value={levels[score.skillId] ?? "NOT_COVERED"}
                onChange={isCompleted ? (level) => setLevels((prev) => ({ ...prev, [score.skillId]: level })) : undefined}
                readOnly={!isCompleted}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6">
        <label className="text-xs font-semibold text-brand-black mb-1.5 block">Overall Notes <span className="text-brand-muted font-normal">(optional)</span></label>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          disabled={!isCompleted}
          rows={3}
          className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-red/30 disabled:bg-brand-surface disabled:text-brand-muted"
          placeholder="Overall feedback for this lesson..."
        />
      </div>

      {error && <p className="text-sm text-brand-red mb-3">{error}</p>}
      {savedMessage && <p className="text-sm text-green-700 mb-3">{savedMessage}</p>}

      {isCompleted && (
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={saveDraft} disabled={saving}
              className="px-4 py-2 border border-brand-border text-brand-black text-sm font-semibold rounded-xl hover:bg-brand-surface transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save Draft"}
            </button>
            {report.published ? (
              <button onClick={() => setConfirmAction("unpublish")} disabled={publishing}
                className="px-4 py-2 border border-brand-border text-brand-muted text-sm font-semibold rounded-xl hover:bg-brand-surface transition-colors disabled:opacity-50">
                Unpublish
              </button>
            ) : (
              <button onClick={() => setConfirmAction("publish")} disabled={publishing || !report.exists}
                title={!report.exists ? "Save a draft before publishing" : undefined}
                className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                Publish
              </button>
            )}
          </div>
          {!report.published && !report.exists && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Action required</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Publish is disabled until you save a draft. Click <strong>Save Draft</strong> first, then Publish becomes available.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                <h3 className="font-bold text-brand-black text-lg">
                  {confirmAction === "publish" ? "Publish Progress Report" : "Unpublish Progress Report"}
                </h3>
                <button onClick={() => setConfirmAction(null)} className="text-brand-muted hover:text-brand-black"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 text-sm text-brand-black">
                {confirmAction === "publish"
                  ? "The student will immediately be able to see this progress report and all scored skills. Continue?"
                  : "The student will no longer be able to see this progress report until you publish it again. Continue?"}
              </div>
              <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-black transition-colors">
                  Go Back
                </button>
                <button onClick={() => togglePublish(confirmAction)} disabled={publishing}
                  className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                  {publishing ? "Working…" : confirmAction === "publish" ? "Publish" : "Unpublish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
