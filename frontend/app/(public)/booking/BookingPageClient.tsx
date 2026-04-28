"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBookingStore } from "@/store/bookingStore";
import { WizardProgress } from "@/components/booking/WizardProgress";
import { Step1LessonType } from "@/components/booking/steps/Step1LessonType";
import { Step2Instructor } from "@/components/booking/steps/Step2Instructor";
import { Step3Package } from "@/components/booking/steps/Step3Package";
import { Step4DateTime } from "@/components/booking/steps/Step4DateTime";
import { Step5StudentDetails } from "@/components/booking/steps/Step5StudentDetails";
import { Step6Payment } from "@/components/booking/steps/Step6Payment";
import { Step7Confirmation } from "@/components/booking/steps/Step7Confirmation";

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1LessonType />;
    case 2: return <Step2Instructor />;
    case 3: return <Step3Package />;
    case 4: return <Step4DateTime />;
    case 5: return <Step5StudentDetails />;
    case 6: return <Step6Payment />;
    case 7: return <Step7Confirmation />;
    default: return null;
  }
}

export default function BookingPageClient() {
  const { currentStep } = useBookingStore();

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
      <div className="bg-white border-b border-brand-border px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-2xl font-extrabold text-brand-black mb-4"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Book a Lesson
          </h1>
          <WizardProgress currentStep={currentStep} />
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
            >
              <StepContent step={currentStep} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
