"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, InboxIcon } from "lucide-react";
import { studentApiFetch } from "@/lib/student-api";
import {
  CompetencyLevel,
  CompetencyLevelControl,
  ScorePercentBadge,
  ScorePercentInput,
} from "@/components/progress/CompetencyLevelControl";

interface ScoreEntry {
  skillId: string;
  skillKey: string;
  skillName: string;
  level: CompetencyLevel | null;
  scorePercent: number | null;
  note: string | null;
}

interface ReportData {
  published: boolean;
  publishedAt: string | null;
  overallNotes: string | null;
  overallPercent: number;
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

export default function StudentProgressReportPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApiFetch(`/bookings/${bookingId}/progress-report`);
      if (res.ok) {
        const json = await res.json();
        setReport(json.data);
      } else {
        setReport(null);
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3 animate-pulse" />
        <p className="text-brand-muted text-sm">Loading progress report…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <Link href="/student/bookings" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-black mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back to Bookings
        </Link>
        <div className="py-16 text-center bg-white rounded-2xl border border-brand-border">
          <InboxIcon className="w-10 h-10 text-brand-border mx-auto mb-3" />
          <p className="text-brand-muted text-sm">Your instructor hasn&apos;t published feedback for this lesson yet.</p>
        </div>
      </div>
    );
  }

  const typeLabel = LESSON_TYPE_LABELS[report.booking.lessonType] ?? report.booking.lessonType;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/student/bookings" className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-black mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Bookings
      </Link>

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-brand-black mb-1">Instructor Feedback</h2>
          <div className="flex items-center gap-3 text-sm text-brand-muted">
            <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(report.booking.scheduledAt)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(report.booking.scheduledAt)}</span>
            <span className="text-xs border border-brand-border px-2 py-0.5 rounded-lg text-brand-black">{typeLabel}</span>
          </div>
        </div>
        <ScorePercentBadge percent={report.overallPercent} />
      </div>

      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-brand-border">
          {report.scores.map((score) => (
            <div key={score.skillId} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-brand-black text-sm">{score.skillName}</p>
                {score.note && <p className="text-xs text-brand-muted mt-0.5">{score.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <CompetencyLevelControl value={score.level} readOnly />
                <ScorePercentInput value={score.scorePercent} readOnly />
              </div>
            </div>
          ))}
        </div>
      </div>

      {report.overallNotes && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5">
          <p className="text-xs font-semibold text-brand-black mb-1.5">Instructor Notes</p>
          <p className="text-sm text-brand-black whitespace-pre-wrap">{report.overallNotes}</p>
        </div>
      )}
    </motion.div>
  );
}
