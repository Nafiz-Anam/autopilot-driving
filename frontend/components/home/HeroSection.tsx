"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Award } from "lucide-react";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";

const rotatingWords = ["Confidence.", "Ease.", "Autopilot."];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden hero-bg-stripe">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left column — 60% */}
          <div className="lg:col-span-3">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[#FF5500] uppercase tracking-widest text-sm font-medium mb-5"
            >
              UK&apos;s Premier Driving School
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#0D0D0D] leading-tight mb-4"
              style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
            >
              Learn to Drive with{" "}
              <span className="block h-[1.2em] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 text-[#E8200A]"
                  >
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="text-lg text-[#6B6B6B] max-w-lg mb-8"
            >
              Find a trusted instructor near you and book your first lesson today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="max-w-md"
            >
              <PostcodeSearch redirectTo="/booking" />
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 mt-8"
            >
              <TrustBadge icon={<Star size={14} className="fill-amber-400 text-amber-400" />} label="4.9/5 Rating" />
              <div className="w-px h-5 bg-[#E5E5E5]" />
              <TrustBadge icon={<Users size={14} className="text-[#E8200A]" />} label="2,000+ Students Passed" />
              <div className="w-px h-5 bg-[#E5E5E5]" />
              <TrustBadge icon={<Award size={14} className="text-[#E8200A]" />} label="DVSA Approved" />
            </motion.div>
          </div>

          {/* Right column — 40% */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative w-full max-w-sm"
            >
              {/* Background geometric shapes */}
              <div
                className="absolute -top-8 -right-8 w-64 h-64 rounded-2xl bg-[#E8200A] opacity-10"
                style={{ transform: "rotate(12deg)" }}
              />
              <div
                className="absolute -bottom-6 -left-6 w-48 h-48 rounded-2xl bg-[#FF5500] opacity-15"
                style={{ transform: "rotate(-8deg)" }}
              />

              {/* Floating instructor card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] p-5 z-10"
                style={{ transform: "rotate(-3deg)" }}
                whileHover={{ rotate: 0, y: -4, boxShadow: "0 20px 40px rgba(232,32,10,0.15)" }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8200A] to-[#FF5500] flex items-center justify-center text-white font-bold text-lg">
                    JW
                  </div>
                  <div>
                    <p className="font-bold text-[#0D0D0D]">James Williams</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs text-[#6B6B6B] ml-1">4.9</span>
                    </div>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Available
                  </span>
                </div>

                <p className="text-xs text-[#6B6B6B] mb-3">SL1 · SL2 · SL3 · Manual & Automatic</p>

                {/* Slots */}
                <p className="text-xs font-bold text-[#0D0D0D] mb-2 uppercase tracking-wider">Available This Week</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Mon 9am", "Tue 2pm", "Wed 10am", "Thu 3pm", "Fri 9am", "Sat 11am"].map((slot) => (
                    <span key={slot} className="text-xs text-center py-1 px-2 bg-[#F5F5F5] rounded-lg text-[#0D0D0D] font-medium">
                      {slot}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0D0D0D]">£42 / hour</span>
                  <span className="text-xs px-3 py-1 bg-[#E8200A] text-white rounded-full font-medium">Book Now</span>
                </div>
              </motion.div>

              {/* Stats badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#0D0D0D] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg z-20"
              >
                8 yrs exp.
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-[#0D0D0D]">
      {icon}
      <span>{label}</span>
    </div>
  );
}
