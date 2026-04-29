"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Calendar, Smartphone, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: GraduationCap,
    title: "Expert DVSA-Approved Instructors",
    description:
      "All our instructors are fully qualified ADIs, DBS checked, and regularly assessed to maintain the highest standards.",
    stat: "100% ADI Qualified",
  },
  {
    icon: Calendar,
    title: "Flexible Lesson Scheduling",
    description:
      "Book lessons 7 days a week to fit your lifestyle. Early mornings, evenings, and weekends always available.",
    stat: "7 Days a Week",
  },
  {
    icon: Smartphone,
    title: "App-Based Booking & Tracking",
    description:
      "Manage lessons, track your progress, and message your instructor — all from one intuitive app.",
    stat: "Real-Time Updates",
  },
  {
    icon: Trophy,
    title: "Pass First Time Guarantee",
    description:
      "Our structured approach and expert tuition gives you the best chance of passing your test first time.",
    stat: "94% Pass Rate",
  },
];

export function WhyAutopilot() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-[#F8F7F5] py-20 lg:py-28 px-4">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-14 gap-5">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[#E8200A] uppercase tracking-widest text-xs font-semibold mb-3"
            >
              Why Choose Us
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D]"
              style={{
                fontFamily: "'Moderniz', 'Barlow', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              The AutoPilot
              <br className="hidden sm:block" /> Difference
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D0D0D] hover:text-[#E8200A] transition-colors duration-200 group"
            >
              About us
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </motion.div>
        </div>

        {/* Cards grid — 2×2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-white rounded-3xl p-7 relative overflow-hidden cursor-default"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
              >
                {/* Hover gradient wash */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at top left, rgba(232,32,10,0.04) 0%, transparent 60%)",
                  }}
                />

                <div className="relative z-10">
                  {/* Icon + stat row */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(135deg, #FFF0EE 0%, #FFE4E0 100%)",
                      }}
                    >
                      <Icon
                        size={24}
                        className="text-[#E8200A] transition-colors duration-300"
                      />
                    </div>
                    <span className="text-xs font-bold text-[#E8200A] bg-[#FFF0EE] px-3 py-1.5 rounded-full">
                      {feature.stat}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#0D0D0D] text-lg mb-2 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
