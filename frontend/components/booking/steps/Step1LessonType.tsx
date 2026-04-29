"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Car, Zap, Rocket, RefreshCw, Award, BookOpen, Check } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import type { LessonType } from "@/types";
import { cn } from "@/lib/utils";

const LESSON_TYPES: {
  id: LessonType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "MANUAL",
    label: "Manual Lesson",
    description: "Learn with a gearbox — the classic way to drive",
    icon: Car,
  },
  {
    id: "AUTOMATIC",
    label: "Automatic Lesson",
    description: "Easier to learn, ideal for city driving",
    icon: Zap,
  },
  {
    id: "INTENSIVE",
    label: "Intensive Course",
    description: "Pass in as little as 1–2 weeks",
    icon: Rocket,
  },
  {
    id: "REFRESHER",
    label: "Refresher Lesson",
    description: "Rebuild confidence after a break",
    icon: RefreshCw,
  },
  {
    id: "PASS_PLUS",
    label: "Pass Plus",
    description: "Post-test advanced training",
    icon: Award,
  },
  {
    id: "THEORY",
    label: "Theory Test Prep",
    description: "Guided practice to ace the theory test",
    icon: BookOpen,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function Step1LessonType() {
  const { lessonType, setLessonType, nextStep } = useBookingStore();

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          What type of lesson?
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Choose the lesson type that suits you best.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        {LESSON_TYPES.map((lt) => {
          const Icon = lt.icon;
          const selected = lessonType === lt.id;

          return (
            <motion.button
              key={lt.id}
              variants={cardVariant}
              onClick={() => setLessonType(lt.id)}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(232,32,10,0.15)" }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative text-left p-5 rounded-2xl border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red",
                selected
                  ? "border-brand-red bg-red-50/70"
                  : "border-brand-border bg-white hover:border-brand-red/40"
              )}
            >
              {/* Checkmark badge */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-bold text-brand-black text-sm mb-1">{lt.label}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{lt.description}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Continue button — slides in after selection */}
      <AnimatePresence>
        {lessonType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={nextStep}
              className="w-full sm:w-auto px-10 py-3.5 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30"
            >
              Continue →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
