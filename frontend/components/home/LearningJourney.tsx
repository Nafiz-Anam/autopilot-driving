"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  BookOpen,
  CheckCircle2,
  FileText,
} from "lucide-react";

const steps = [
  {
    Icon: FileText,
    title: "Get your provisional licence",
    desc: "Apply to the DVLA to get your licence and start your learning journey.",
    href: "https://www.gov.uk/apply-first-provisional-driving-licence",
    external: true,
  },
  {
    Icon: CalendarDays,
    title: "Book a lesson",
    desc: "Choose your instructor and lesson time online in just a few taps.",
    href: "https://autopilotdrivingschool.co.uk/booking",
    external: false,
  },
  {
    Icon: BookOpen,
    title: "Theory test",
    desc: "Study for your theory test and pass it before taking your practical test.",
    href: "https://www.gov.uk/book-theory-test",
    external: true,
  },
  {
    Icon: CheckCircle2,
    title: "Pass your test",
    desc: "Once you pass, you are free to drive on your own whenever you want.",
    href: "https://www.gov.uk/book-driving-test",
    external: true,
  },
];

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
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Learn to Drive with Autopilot
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
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.08 * i }}
                  whileHover={{ x: 6 }}
                >
                  <Link
                    href={step.href}
                    target={step.external ? "_blank" : undefined}
                    rel={step.external ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 rounded-2xl p-3 sm:p-4 transition-colors hover:bg-[#FAFAFA] group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF2F0] border border-[#FFE4DF] text-[#E8200A] flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:bg-[#FFE8E4] transition-colors">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_65%)]" />
                      <step.Icon size={24} className="relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-[#0D0D0D] font-semibold text-base leading-tight mb-1.5 group-hover:text-[#E8200A] transition-colors">
                        {i + 1}. {step.title}
                      </h3>
                      <p className="text-[#666] text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden">
              <Image
                src="/homepage-section.png"
                alt="Learn to drive with Autopilot"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
