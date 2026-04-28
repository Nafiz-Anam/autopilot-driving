"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Lesson Type" },
  { num: 2, label: "Instructor" },
  { num: 3, label: "Package" },
  { num: 4, label: "Date & Time" },
  { num: 5, label: "Your Details" },
  { num: 6, label: "Payment" },
  { num: 7, label: "Confirmed" },
];

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;
  const currentLabel = STEPS.find((s) => s.num === currentStep)?.label ?? "";

  return (
    <div className="w-full">
      {/* Mobile: compact indicator */}
      <div className="flex sm:hidden items-center justify-between mb-3">
        <span className="text-sm font-semibold text-brand-black">{currentLabel}</span>
        <span className="text-xs text-brand-muted font-medium">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>

      {/* Desktop: full step row */}
      <div className="hidden sm:flex items-start justify-between mb-4 relative">
        {/* Connector track (behind circles) */}
        <div className="absolute top-4 left-[7.14%] right-[7.14%] h-0.5 bg-brand-border z-0" />

        {STEPS.map((step) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;

          return (
            <div key={step.num} className="flex flex-col items-center gap-2 z-10 relative">
              <motion.div
                initial={false}
                animate={
                  isCompleted
                    ? { scale: 1, backgroundColor: "#FF5500" }
                    : isActive
                    ? { scale: 1.15, backgroundColor: "#E8200A" }
                    : { scale: 1, backgroundColor: "#FFFFFF" }
                }
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-sm",
                  isCompleted
                    ? "border-brand-orange text-white"
                    : isActive
                    ? "border-brand-red text-white"
                    : "border-brand-border text-brand-muted bg-white"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                ) : (
                  <span>{step.num}</span>
                )}
              </motion.div>

              <span
                className={cn(
                  "text-[10px] font-medium leading-tight text-center max-w-[64px] whitespace-nowrap",
                  isActive
                    ? "text-brand-black font-bold"
                    : isCompleted
                    ? "text-brand-orange"
                    : "text-brand-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Animated progress bar */}
      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-brand-red to-brand-orange rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
