"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, CalendarClock, RefreshCcw } from "lucide-react";

const pillars = [
  {
    icon: Search,
    title: "Find an Instructor",
    description:
      "Search DVSA-approved instructors near you, compare prices and availability, and pick the one that fits your schedule.",
  },
  {
    icon: CalendarClock,
    title: "Book & Manage Lessons",
    description:
      "Book, reschedule, or cancel lessons in a few taps and track your progress toward your practical test.",
  },
  {
    icon: RefreshCcw,
    title: "Google Calendar Sync",
    description:
      "Instructors run their diary from one dashboard and can optionally connect Google Calendar so new bookings show up automatically.",
  },
];

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-white py-14 sm:py-20 lg:py-24 px-4">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="text-[#E8200A] uppercase tracking-widest text-xs font-semibold mb-3"
          >
            About Autopilot
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D] mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            An Online Platform for Driving Lessons
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[#6B6B6B] text-sm sm:text-base leading-relaxed"
          >
            Autopilot connects learners with DVSA-approved instructors and
            gives instructors the tools to run their teaching business.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-white rounded-3xl p-7 relative overflow-hidden cursor-default border border-[#F0F0F0]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at top left, rgba(232,32,10,0.04) 0%, transparent 60%)",
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, #FFF0EE 0%, #FFE4E0 100%)",
                    }}
                  >
                    <Icon size={24} className="text-[#E8200A]" />
                  </div>

                  <h3 className="font-bold text-[#0D0D0D] text-lg mb-2 leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-[#6B6B6B] text-sm leading-relaxed">
                    {pillar.description}
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
