"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CalendarDays,
  BookOpen,
  CheckCircle2,
  FileText,
  ClipboardCheck,
} from "lucide-react";

const steps = [
  {
    Icon: FileText,
    title: "Get your provisional licence",
    desc: "Apply to the DVLA to get your licence and start your learning journey.",
  },
  {
    Icon: CalendarDays,
    title: "Book a lesson",
    desc: "Choose your instructor and lesson time online in just a few taps.",
  },
  {
    Icon: BookOpen,
    title: "Theory test",
    desc: "Study for your theory test and pass it before taking your practical test.",
  },
  {
    Icon: CheckCircle2,
    title: "Pass your test",
    desc: "Once you pass, you are free to drive on your own whenever you want.",
  },
];

function LearningIllustration() {
  return (
    <div className="relative w-full max-w-[400px]">
      <motion.div
        className="rounded-[2.2rem] border border-[#ECECEC] bg-white p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.09)]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <div className="rounded-[1.6rem] overflow-hidden bg-[#F4F4F4] border border-[#E9E9E9]">
          <div className="h-[170px] sm:h-[200px] relative bg-[linear-gradient(180deg,#DDEEFF_0%,#EAF4FF_48%,#E6E6E6_49%,#D9D9D9_100%)]">
            <div className="absolute left-1/2 top-[46%] -translate-x-1/2 w-[3px] h-[26%] rounded-full bg-white/90" />
            <div className="absolute left-[35%] top-[46%] -translate-x-1/2 w-[2px] h-[26%] rounded-full bg-white/60" />
            <div className="absolute left-[65%] top-[46%] -translate-x-1/2 w-[2px] h-[26%] rounded-full bg-white/60" />
          </div>
          <div className="h-[140px] sm:h-[160px] relative bg-[#242424]">
            <div className="absolute left-[8%] right-[8%] bottom-[18%] h-[22%] rounded-full bg-[#151515]" />
            <div className="absolute left-[14%] bottom-[30%] w-[30%] h-[46%] rounded-[1.2rem] bg-[#7F7F7F]" />
            <div className="absolute right-[14%] bottom-[30%] w-[30%] h-[46%] rounded-[1.2rem] bg-[#7F7F7F]" />
            <div className="absolute left-[26%] bottom-[52%] w-[11%] h-[14%] rounded-full bg-[#C98A6D]" />
            <div className="absolute right-[26%] bottom-[52%] w-[11%] h-[14%] rounded-full bg-[#C98A6D]" />
            <div className="absolute left-[22%] bottom-[36%] w-[19%] h-[18%] rounded-[0.9rem] bg-[#20345C]" />
            <div className="absolute right-[20%] bottom-[36%] w-[22%] h-[18%] rounded-[0.9rem] bg-[#D49A1A]" />
            <motion.div
              className="absolute left-1/2 bottom-[23%] -translate-x-1/2 w-[20%] aspect-square rounded-full border-[7px] border-[#676767] bg-[#1F1F1F]"
              animate={{ rotate: [0, 7, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-3 py-2.5 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#E8200A]" />
            <span className="text-xs text-[#4C4C4C] font-medium">Tue 3:30 PM</span>
          </div>
          <div className="rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-3 py-2.5 flex items-center gap-2 justify-start">
            <CheckCircle2 size={14} className="text-[#1AA255]" />
            <span className="text-xs text-[#4C4C4C] font-medium">Instructor assigned</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LearningJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24 px-4">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D] mb-5"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif", letterSpacing: "-0.02em" }}
          >
            Learn to Drive with AutoPilot
          </h2>
          <p className="text-[#5B5B5B] text-sm sm:text-base leading-relaxed">
            With DVSA-approved instructors, modern vehicles, and clear step-by-step
            guidance, learning to drive is simple from your first booking to your test pass.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          <div>
            <p className="text-[#0D0D0D] font-semibold mb-6">This is how you get driving</p>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <motion.article
                  key={step.title}
                  className="flex items-start gap-4 rounded-2xl p-3 sm:p-4 transition-colors hover:bg-[#FAFAFA]"
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.08 * i }}
                  whileHover={{ x: 6 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#FFF2F0] border border-[#FFE4DF] text-[#E8200A] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_65%)]" />
                    <step.Icon size={24} className="relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-[#0D0D0D] font-semibold text-base leading-tight mb-1.5">
                      {i + 1}. {step.title}
                    </h3>
                    <p className="text-[#666] text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-[2rem] bg-[#F7F7F7] p-6 sm:p-8 min-h-[380px] sm:min-h-[460px] flex items-center justify-center">
              <div className="relative w-full max-w-[380px]">
                <LearningIllustration />

                <div className="absolute -bottom-4 right-1 sm:right-0 rounded-2xl bg-[#0D0D0D] text-white px-4 py-3 flex items-center gap-2 shadow-lg">
                  <ClipboardCheck size={16} />
                  <span className="text-xs sm:text-sm font-medium">Ready for test day</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
