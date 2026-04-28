"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  Shield,
  MapPin,
  Gauge,
  FlaskConical,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
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

// ─── Data ─────────────────────────────────────────────────────────────────────
const categories: Category[] = [
  {
    id: "road-signs",
    name: "Road Signs",
    icon: MapPin,
    progress: 70,
    total: 50,
    answered: 35,
  },
  {
    id: "rules",
    name: "Rules of the Road",
    icon: BookOpen,
    progress: 65,
    total: 60,
    answered: 39,
  },
  {
    id: "safety",
    name: "Vehicle Safety",
    icon: Shield,
    progress: 55,
    total: 40,
    answered: 22,
  },
  {
    id: "hazards",
    name: "Hazard Perception",
    icon: AlertTriangle,
    progress: 60,
    total: 45,
    answered: 27,
  },
  {
    id: "handling",
    name: "Vehicle Handling",
    icon: Car,
    progress: 58,
    total: 35,
    answered: 20,
  },
];

const mockQuestions: Question[] = [
  {
    id: "q1",
    category: "road-signs",
    question: "What does a red circular road sign mean?",
    options: [
      "Warning of a hazard ahead",
      "Mandatory prohibition — you must NOT do this",
      "Gives information to drivers",
      "Advisory speed recommendation",
    ],
    correct: 1,
    explanation:
      "Red circular signs are mandatory prohibitions — they tell you what you MUST NOT do, such as 'No Entry' or speed limits.",
  },
  {
    id: "q2",
    category: "rules",
    question:
      "What is the national speed limit on a single carriageway road for a car?",
    options: ["50 mph", "60 mph", "70 mph", "80 mph"],
    correct: 1,
    explanation:
      "The national speed limit on a single carriageway road for cars and motorcycles is 60 mph.",
  },
  {
    id: "q3",
    category: "rules",
    question: "When MUST you use your headlights?",
    options: [
      "During sunset only",
      "When visibility is seriously reduced",
      "Between 11pm and 6am only",
      "Only on motorways at night",
    ],
    correct: 1,
    explanation:
      "You must use headlights when visibility is seriously reduced — generally when you cannot see for more than 100 metres.",
  },
  {
    id: "q4",
    category: "safety",
    question: "What is the minimum tread depth for car tyres?",
    options: ["1.0mm", "1.6mm", "2.0mm", "2.5mm"],
    correct: 1,
    explanation:
      "The legal minimum tread depth for car tyres is 1.6mm across the central three-quarters of the tyre, around its entire circumference.",
  },
  {
    id: "q5",
    category: "hazards",
    question:
      "You are about to overtake a cyclist. How much space should you leave?",
    options: [
      "0.5 metres",
      "1 metre",
      "1.5 metres",
      "At least 1.5 metres — more at higher speeds",
    ],
    correct: 3,
    explanation:
      "The Highway Code recommends leaving at least 1.5 metres when overtaking a cyclist at low speeds, and more at higher speeds.",
  },
  {
    id: "q6",
    category: "handling",
    question:
      "What is the two-second rule used for?",
    options: [
      "Checking mirrors before a manoeuvre",
      "Maintaining a safe following distance",
      "Timing traffic light changes",
      "Estimating braking distance at night",
    ],
    correct: 1,
    explanation:
      "The two-second rule helps you maintain a safe following distance from the vehicle ahead in normal conditions. In wet conditions, double it to four seconds.",
  },
  {
    id: "q7",
    category: "road-signs",
    question: "A triangular road sign is used to indicate what?",
    options: [
      "An instruction you must obey",
      "Information for drivers",
      "A warning of a hazard ahead",
      "The end of a restriction",
    ],
    correct: 2,
    explanation:
      "Triangular signs with a red border warn drivers of a hazard or potential danger ahead.",
  },
  {
    id: "q8",
    category: "rules",
    question: "At a crossroads with no road markings, who has priority?",
    options: [
      "The vehicle on the right always has priority",
      "The largest vehicle has priority",
      "No vehicle has automatic priority",
      "The vehicle that arrives first has priority",
    ],
    correct: 2,
    explanation:
      "At an unmarked crossroads, no vehicle has automatic priority. All drivers should proceed with caution and give way as needed.",
  },
  {
    id: "q9",
    category: "safety",
    question: "When should you use your hazard warning lights?",
    options: [
      "When parking on double yellow lines",
      "When your vehicle is a temporary obstruction to warn other drivers",
      "Whenever it is raining heavily",
      "When driving slowly in fog",
    ],
    correct: 1,
    explanation:
      "Hazard warning lights should be used when your vehicle is a temporary obstruction — for example, if you break down on a motorway hard shoulder.",
  },
  {
    id: "q10",
    category: "handling",
    question: "What does aquaplaning mean?",
    options: [
      "Driving too fast around a corner",
      "When a layer of water prevents tyre contact with the road",
      "Skidding on ice",
      "Losing steering on a gravel road",
    ],
    correct: 1,
    explanation:
      "Aquaplaning occurs when a layer of water builds up between the tyres and the road, causing a loss of traction. Reduce speed in wet conditions to prevent it.",
  },
];

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
function MockTest({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(mockQuestions.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);

  const q = mockQuestions[current];
  const userAnswer = answers[current];

  function handleSelect(idx: number) {
    if (userAnswer !== null) return;
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
  }

  function handleNext() {
    if (current < mockQuestions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShowResult(true);
    }
  }

  const score = answers.filter(
    (a, i) => a === mockQuestions[i].correct
  ).length;
  const passed = score / mockQuestions.length >= 0.86; // DVSA pass mark ~86%
  const percent = Math.round((score / mockQuestions.length) * 100);

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
              {score}/{mockQuestions.length}
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
              setAnswers(Array(mockQuestions.length).fill(null));
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
              of {mockQuestions.length}
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
            width: `${(current / mockQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Category pill */}
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-red bg-red-50 px-2.5 py-1 rounded-full mb-4">
        {categories.find((c) => c.id === q.category)?.name ?? q.category}
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
          {current < mockQuestions.length - 1
            ? "Next Question →"
            : "See My Results"}
        </motion.button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentTheoryPage() {
  useSession();
  const [testOpen, setTestOpen] = useState(false);

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
            <MockTest onClose={() => setTestOpen(false)} />
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
              {categories.map((cat, i) => (
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
                    onClick={() => setTestOpen(true)}
                    className="mt-auto w-full py-2 text-xs font-semibold text-brand-red border border-red-200 rounded-lg hover:bg-brand-red hover:text-white hover:border-brand-red transition-all duration-200"
                  >
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
                  onClick={() => setTestOpen(true)}
                  className="px-8 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-orange transition-colors duration-200 shadow-lg shadow-red-900/30"
                >
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
