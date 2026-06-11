"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSession } from "@/components/providers/AppAuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  Shield,
  MapPin,
  FlaskConical,
  Trophy,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";
import { getNextAuthBridgeHeaders } from "@/lib/backend-auth-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  total: number;
  answered: number;
}

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ApiProgressEntry {
  category?: string;
  categoryId?: string;
  score?: number;
  progress?: number;
  correct?: number;
  answered?: number;
  total: number;
}

// ─── Base category definitions (icons + totals) ───────────────────────────────
const BASE_CATEGORIES: Omit<Category, "progress" | "answered">[] = [
  { id: "road-signs", name: "Road Signs", icon: MapPin, total: 50 },
  { id: "rules", name: "Rules of the Road", icon: BookOpen, total: 60 },
  { id: "safety", name: "Vehicle Safety", icon: Shield, total: 40 },
  { id: "hazards", name: "Hazard Perception", icon: AlertTriangle, total: 45 },
  { id: "handling", name: "Vehicle Handling", icon: Car, total: 35 },
];

const DEFAULT_CATEGORIES: Category[] = BASE_CATEGORIES.map((c) => ({
  ...c,
  progress: 0,
  answered: 0,
}));

function normalizeCategoryId(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProgressBar({
  value,
  className,
  color = "bg-brand-red",
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "h-2 bg-brand-border rounded-full overflow-hidden",
        className
      )}
    >
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: "0%" }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Mock Test Component ─────────────────────────────────────────────────────
function MockTest({
  categories,
  questions,
  onClose,
  onComplete,
}: {
  categories: Category[];
  questions: Question[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(questions.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);

  const q = questions[current];
  const userAnswer = answers[current];

  async function handleSelect(idx: number) {
    if (userAnswer !== null) return;
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);

    try {
      const headers = await getNextAuthBridgeHeaders();
      await fetch(backendApiUrl("/student/theory/progress"), {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: q.id,
          isCorrect: idx === q.correct,
        }),
      });
    } catch {
      // silently ignore
    }
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShowResult(true);
      onComplete();
    }
  }

  const score = answers.filter(
    (a, i) => a !== null && a === questions[i]?.correct
  ).length;
  const passed = questions.length > 0 && score / questions.length >= 0.86;
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  if (!q) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-brand-muted">
        <AlertTriangle className="w-8 h-8 text-brand-orange" />
        <p className="text-sm">No questions available. Please try again.</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200"
        >
          Back to Training
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8"
      >
        {/* Score circle */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={cn(
              "w-28 h-28 rounded-full flex flex-col items-center justify-center mb-4 border-4",
              passed
                ? "border-green-400 bg-green-50"
                : "border-brand-red bg-red-50"
            )}
          >
            {passed ? (
              <CheckCircle className="w-8 h-8 text-green-600 mb-1" />
            ) : (
              <XCircle className="w-8 h-8 text-brand-red mb-1" />
            )}
            <span className="text-2xl font-extrabold text-brand-black leading-none">
              {percent}%
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-brand-black mb-1">
            {passed ? "Well Done!" : "Keep Practising"}
          </h3>
          <p className="text-brand-muted text-sm mb-1">
            You scored{" "}
            <strong className="text-brand-black">
              {score}/{questions.length}
            </strong>{" "}
            correct
          </p>
          <span
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full",
              passed
                ? "bg-green-100 text-green-700"
                : "bg-red-50 text-brand-red"
            )}
          >
            {passed ? "PASS" : "FAIL"} &mdash; pass mark is 86%
          </span>
        </div>

        {/* Category breakdown */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-brand-black mb-4">
            Category Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-brand-surface rounded-xl p-3.5 flex items-center gap-3"
              >
                <cat.icon className="w-4 h-4 text-brand-red shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold text-brand-black truncate">
                      {cat.name}
                    </p>
                    <span className="text-xs font-bold text-brand-red ml-2">
                      {cat.progress}%
                    </span>
                  </div>
                  <ProgressBar value={cat.progress} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setAnswers(Array(questions.length).fill(null));
              setCurrent(0);
              setShowResult(false);
            }}
            className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200"
          >
            Try Again
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-brand-surface text-brand-black rounded-xl font-semibold hover:bg-brand-border transition-colors duration-200 border border-brand-border"
          >
            Back to Training
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-brand-red" />
          <span className="text-sm font-semibold text-brand-black">
            Question {current + 1}{" "}
            <span className="text-brand-muted font-normal">
              of {questions.length}
            </span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-brand-muted hover:text-brand-red transition-colors font-medium"
        >
          &times; Close test
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-brand-red rounded-full transition-all duration-300"
          style={{
            width: `${(current / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Category pill */}
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-red bg-red-50 px-2.5 py-1 rounded-full mb-4">
        {categories.find((c) => c.id === normalizeCategoryId(q.category))?.name ?? q.category}
      </span>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >
          <h3 className="text-lg font-bold text-brand-black mb-5 leading-snug">
            {q.question}
          </h3>

          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const answered = userAnswer !== null;
              const isUserPick = answered && userAnswer === idx;
              const isCorrect = idx === q.correct;

              let cls =
                "border-brand-border hover:border-brand-red text-brand-black";
              if (answered) {
                if (isCorrect)
                  cls = "border-green-500 bg-green-50 text-green-800";
                else if (isUserPick)
                  cls = "border-brand-red bg-red-50 text-brand-red";
                else cls = "border-brand-border text-brand-muted opacity-60";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                    cls
                  )}
                >
                  <span className="inline-block w-5 text-xs font-bold opacity-60 mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                  {answered && isCorrect && (
                    <CheckCircle className="inline w-3.5 h-3.5 ml-2 text-green-600" />
                  )}
                  {answered && isUserPick && !isCorrect && (
                    <XCircle className="inline w-3.5 h-3.5 ml-2 text-brand-red" />
                  )}
                </button>
              );
            })}
          </div>

          {userAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-brand-surface rounded-xl border border-brand-border text-xs text-brand-muted leading-relaxed"
            >
              <strong className="text-brand-black text-xs">Explanation: </strong>
              {q.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {userAnswer !== null && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          className="mt-5 w-full py-3 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-orange transition-colors duration-200"
        >
          {current < questions.length - 1
            ? "Next Question →"
            : "See My Results"}
        </motion.button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentTheoryPage() {
  useAppSession();
  const [testOpen, setTestOpen] = useState(false);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const fetchProgress = useCallback(async () => {
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl("/student/theory/progress"), { headers });
      if (res.ok) {
        const data: ApiProgressEntry[] | { data: ApiProgressEntry[] } = await res.json();
        const entries: ApiProgressEntry[] = Array.isArray(data) ? data : (data as { data: ApiProgressEntry[] }).data ?? [];
        if (entries.length > 0) {
          setCategories(
            BASE_CATEGORIES.map((base) => {
              const match = entries.find((e) => {
                const idFromCategory = e.category ? normalizeCategoryId(e.category) : undefined;
                return e.categoryId === base.id || idFromCategory === base.id;
              });
              const total = match?.total ?? base.total;
              const correct = match?.correct ?? 0;
              const progress =
                match?.progress ??
                match?.score ??
                (total > 0 ? Math.round((correct / total) * 100) : 0);
              return {
                ...base,
                progress,
                answered: match?.answered ?? total,
                total,
              };
            })
          );
        }
      }
    } catch {
      // keep defaults on error
    }
  }, []);

  const openTest = useCallback(async () => {
    setTestLoading(true);
    try {
      const headers = await getNextAuthBridgeHeaders();
      const res = await fetch(backendApiUrl("/student/theory/questions?limit=10"), { headers });
      if (res.ok) {
        const data = await res.json();
        const qs: Question[] = data.data ?? [];
        setTestQuestions(qs);
      }
    } catch {
      // keep any existing questions
    } finally {
      setTestLoading(false);
    }
    setTestOpen(true);
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const totalAnswered = categories.reduce((sum, c) => sum + c.answered, 0);
  const totalQuestions = categories.reduce((sum, c) => sum + c.total, 0);
  const overallProgress = Math.round(
    categories.reduce((sum, c) => sum + c.progress, 0) / categories.length
  );

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-extrabold text-brand-black">
          Theory Training
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Practice, track progress, and ace your DVSA theory test.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {testOpen ? (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden"
          >
            <MockTest
              categories={categories}
              questions={testQuestions}
              onClose={() => {
                setTestOpen(false);
                setTestQuestions([]);
                fetchProgress();
              }}
              onComplete={() => {
                // Progress will be refetched when the modal closes
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            {/* ── Hero / overall progress ── */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-brand-black mb-0.5">
                    Overall Theory Progress
                  </h3>
                  <p className="text-xs text-brand-muted">
                    {totalAnswered} questions answered &middot;{" "}
                    {Math.round(totalAnswered * (overallProgress / 100))} correct
                  </p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-brand-red leading-none">
                    {overallProgress}%
                  </span>
                  <span className="text-sm text-brand-muted mb-1">
                    / {totalQuestions} Qs
                  </span>
                </div>
              </div>
              <ProgressBar value={overallProgress} className="h-3" />
              <div className="mt-3 flex gap-6 text-xs text-brand-muted">
                <span>
                  Pass mark:{" "}
                  <strong className="text-brand-black">86% (43/50)</strong>
                </span>
                <span>
                  Hazard perception:{" "}
                  <strong className="text-brand-black">44/75</strong>
                </span>
              </div>
            </motion.div>

            {/* ── Category grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col gap-3 group hover:border-brand-red/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-brand-red transition-colors duration-200">
                      <cat.icon className="w-4.5 h-4.5 text-brand-red group-hover:text-white transition-colors duration-200" />
                    </div>
                    <p className="text-sm font-semibold text-brand-black">
                      {cat.name}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-brand-muted">
                        {cat.answered}/{cat.total} answered
                      </span>
                      <span className="text-sm font-extrabold text-brand-red">
                        {cat.progress}%
                      </span>
                    </div>
                    <ProgressBar
                      value={cat.progress}
                      color={
                        cat.progress >= 70
                          ? "bg-green-500"
                          : cat.progress >= 55
                          ? "bg-brand-orange"
                          : "bg-brand-red"
                      }
                    />
                  </div>

                  <button
                    onClick={openTest}
                    disabled={testLoading}
                    className="mt-auto w-full py-2 text-xs font-semibold text-brand-red border border-red-200 rounded-lg hover:bg-brand-red hover:text-white hover:border-brand-red transition-all duration-200 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-1.5"
                  >
                    {testLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : null}
                    Practice {cat.name}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* ── Mock test CTA ── */}
            <motion.div
              variants={itemVariants}
              className="bg-brand-black rounded-2xl p-8 text-white text-center relative overflow-hidden"
            >
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-brand-red/15 pointer-events-none" />
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/4 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-14 h-14 bg-brand-red/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-7 h-7 text-brand-orange" />
                </div>
                <h3 className="text-2xl font-extrabold mb-2">
                  Ready for the Full Mock Test?
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
                  10 randomised questions from all categories. Aim for 86%+ to
                  simulate passing the DVSA theory test.
                </p>
                <button
                  onClick={openTest}
                  disabled={testLoading}
                  className="px-8 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-orange transition-colors duration-200 shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-wait inline-flex items-center gap-2"
                >
                  {testLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Start Mock Test &rarr;
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
