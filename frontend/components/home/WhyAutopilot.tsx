"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Calendar, Smartphone, Trophy } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Expert DVSA-Approved Instructors",
    description:
      "All our instructors are fully qualified ADIs, DBS checked, and regularly assessed to maintain the highest standards.",
  },
  {
    icon: Calendar,
    title: "Flexible Lesson Scheduling",
    description:
      "Book lessons 7 days a week to fit your lifestyle. Early mornings, evenings, and weekends available.",
  },
  {
    icon: Smartphone,
    title: "App-Based Booking & Tracking",
    description:
      "Manage your lessons, track your progress, and communicate with your instructor — all in one place.",
  },
  {
    icon: Trophy,
    title: "Pass First Time Guarantee",
    description:
      "Our structured approach and expert tuition gives you the best chance of passing your test first time.",
  },
];

export function WhyAutopilot() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-white py-20 lg:py-28 px-4">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-[#FF5500] uppercase tracking-widest text-sm font-medium mb-3">
            Why Choose Us
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D]"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            The AutoPilot Difference
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(232,32,10,0.15)" }}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-6 cursor-default transition-shadow border-t-4 border-t-[#E8200A]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFF5F5] flex items-center justify-center mb-4">
                  <Icon size={24} className="text-[#E8200A]" />
                </div>
                <h3 className="font-bold text-[#0D0D0D] text-base mb-2">{feature.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
