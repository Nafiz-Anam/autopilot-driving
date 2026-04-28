"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, CalendarDays, BookOpen, CheckCircle } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: FileText,
    title: "Apply for Provisional Licence",
    description: "Start with the DVLA to get your provisional driving licence.",
  },
  {
    number: 2,
    icon: CalendarDays,
    title: "Book Lessons with Autopilot",
    description: "Find your ideal instructor and book your first lesson.",
  },
  {
    number: 3,
    icon: BookOpen,
    title: "Sit Your Theory Test",
    description: "Prepare with our theory portal and pass your theory test.",
  },
  {
    number: 4,
    icon: CheckCircle,
    title: "Pass Your Practical Test",
    description: "Drive with confidence and earn your full UK licence.",
  },
];

export function LearningJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-[#0D0D0D] py-20 lg:py-28 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
          ref={ref}
        >
          <p className="text-[#FF5500] uppercase tracking-widest text-sm font-medium mb-3">
            Step by Step
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            Your Road to Passing
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-[#2A2A2A]">
            <motion.div
              className="absolute inset-0 bg-[#FF5500] origin-left"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex flex-col items-center text-center relative"
                >
                  <div className="w-20 h-20 rounded-full bg-[#E8200A] flex items-center justify-center mb-5 relative z-10">
                    <span
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF5500] flex items-center justify-center text-white text-xs font-bold"
                    >
                      {step.number}
                    </span>
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
