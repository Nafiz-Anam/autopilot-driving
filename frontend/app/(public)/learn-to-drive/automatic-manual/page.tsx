"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { cn } from "@/lib/utils";

const comparisonRows = [
  { label: "Cost Per Lesson", manual: "£42 / hr", automatic: "£42 / hr" },
  { label: "Pass Rate", manual: "~47% national avg", automatic: "~52% national avg" },
  { label: "Licence Type", manual: "Manual + Automatic", automatic: "Automatic cars only" },
  { label: "Career Flexibility", manual: "Any vehicle type", automatic: "Limited to automatic" },
  { label: "Driving Abroad", manual: "Full flexibility", automatic: "Restricted in many countries" },
];

const quizQuestions = [
  { id: 1, text: "Do you plan to drive abroad often?" },
  { id: 2, text: "Do you want maximum licence flexibility?" },
  { id: 3, text: "Are you on a tight budget?" },
];

function getRecommendation(answers: boolean[]): { type: "Manual" | "Automatic"; reason: string } {
  const [abroad, flexibility, budget] = answers;
  if (abroad || flexibility) {
    return {
      type: "Manual",
      reason:
        "A manual licence gives you the freedom to drive any car, anywhere in the world. It offers maximum flexibility for your career and travels abroad.",
    };
  }
  if (!budget) {
    return {
      type: "Automatic",
      reason:
        "If flexibility isn't your top priority, an automatic transmission is easier to learn and often has a higher pass rate. Great if you just need to get driving quickly.",
    };
  }
  return {
    type: "Manual",
    reason:
      "Manual and automatic lessons are the same price, but a manual licence opens more doors. We recommend starting with manual for the best long-term value.",
  };
}

function Quiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  function handleAnswer(yes: boolean) {
    const newAnswers = [...answers, yes];
    if (current < quizQuestions.length - 1) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
    } else {
      setAnswers(newAnswers);
      setDone(true);
    }
  }

  function reset() {
    setCurrent(0);
    setAnswers([]);
    setDone(false);
  }

  const recommendation = done ? getRecommendation(answers) : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
        {!done ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {current + 1}
                </span>
                <span className="text-xs text-brand-muted">of {quizQuestions.length}</span>
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-6" style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}>
                {quizQuestions[current].text}
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 py-3 border-2 border-brand-border rounded-xl font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 py-3 border-2 border-brand-border rounded-xl font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
                >
                  No
                </button>
              </div>
              <div className="mt-6 flex gap-1.5">
                {quizQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      i <= current ? "bg-brand-red" : "bg-brand-border"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">✓</span>
              </div>
              <p className="text-sm text-brand-muted uppercase tracking-wider mb-1">Our Recommendation</p>
              <h3
                className="text-3xl font-bold text-brand-black"
                style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
              >
                {recommendation!.type} Lessons
              </h3>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed mb-6 text-center">
              {recommendation!.reason}
            </p>
            <Link
              href="/booking"
              className="block w-full text-center px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200"
            >
              Book {recommendation!.type} Lessons
            </Link>
            <button
              onClick={reset}
              className="block w-full text-center mt-3 text-sm text-brand-muted hover:text-brand-red transition-colors duration-200"
            >
              Retake quiz
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function AutomaticManualPage() {
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero title="Automatic & Manual Driving" dark={true} />

      {/* Comparison Table */}
      <section className="py-16 lg:py-24 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Manual vs Automatic — Side by Side
            </h2>
            <p className="text-brand-muted">
              Not sure which transmission to learn in? Here&apos;s everything you need to know.
            </p>
          </div>
          <motion.div
            ref={tableRef}
            initial={{ opacity: 0, y: 24 }}
            animate={tableInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto rounded-2xl border border-brand-border shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-black text-white">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold">Manual</th>
                  <th className="px-6 py-4 text-center font-semibold">Automatic</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-brand-surface"}>
                    <td className="px-6 py-4 font-medium text-brand-black">{row.label}</td>
                    <td className="px-6 py-4 text-center text-brand-muted">{row.manual}</td>
                    <td className="px-6 py-4 text-center text-brand-muted">{row.automatic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Quiz */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Not Sure? Take Our Quiz
            </h2>
            <p className="text-brand-muted">
              Answer 3 quick questions and we&apos;ll recommend the right option for you.
            </p>
          </div>
          <Quiz />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-black px-4 text-center text-white">
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Ready to Start?
        </h2>
        <p className="text-brand-muted mb-8">Book your first lesson — no commitment needed.</p>
        <Link
          href="/booking"
          className="inline-block px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
        >
          Book a Lesson
        </Link>
      </section>
    </>
  );
}
