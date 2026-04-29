"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Award, ChevronDown } from "lucide-react";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";
import { DrivingScene } from "./DrivingScene";

const rotatingWords = ["Confidence.", "Freedom.", "Autopilot."];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setWordIndex((p) => (p + 1) % rotatingWords.length),
      2800
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex flex-col overflow-hidden bg-white">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D8D8D8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }}
      />
      {/* Brand glow – top right */}
      <motion.div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(232,32,10,0.06) 0%, transparent 65%)",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Main grid ── */}
      <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
        <div className="grid md:grid-cols-5 gap-8 md:gap-10 lg:gap-14 items-center w-full">

          {/* ── LEFT — 60% ── */}
          <div className="md:col-span-3">
            {/* Pill label */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 bg-[#FFF0EE] border border-[#FFCDC5] rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-[#E8200A] animate-pulse" />
              <span className="text-[#E8200A] text-sm font-semibold">
                UK&apos;s Premier Driving School
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-[2.4rem] lg:text-[3.75rem] font-bold text-[#0D0D0D] leading-[1.05] tracking-tight mb-4"
              style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif" }}
            >
              Learn to Drive
              <br />
              with{" "}
              <span className="relative inline-flex h-[1.15em] overflow-hidden align-bottom min-w-[9ch] md:min-w-[10ch] lg:min-w-[12ch]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: "0%" }}
                    exit={{ opacity: 0, y: "-100%" }}
                    transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-base md:text-lg lg:text-xl text-[#6B6B6B] max-w-lg mb-8 leading-relaxed"
            >
              Find a DVSA-approved instructor near you and book your first
              lesson in under 60 seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="max-w-md mb-8"
            >
              <PostcodeSearch redirectTo="/booking" />
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex flex-wrap items-center gap-5"
            >
              <TrustBadge
                icon={<Star size={13} className="fill-amber-400 text-amber-400" />}
                label="4.9/5 Rating"
              />
              <div className="w-px h-4 bg-[#E5E5E5]" />
              <TrustBadge
                icon={<Users size={13} className="text-[#E8200A]" />}
                label="2,000+ Passed"
              />
              <div className="w-px h-4 bg-[#E5E5E5]" />
              <TrustBadge
                icon={<Award size={13} className="text-[#E8200A]" />}
                label="DVSA Approved"
              />
            </motion.div>
          </div>

          {/* ── RIGHT — 40% — Three.js driving scene ── */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div
              className="relative w-full h-[300px] sm:h-[400px] lg:h-[520px] rounded-3xl overflow-hidden"
              style={{
                boxShadow:
                  "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.14)",
              }}
            >
              {/* Three.js canvas — fills the container */}
              <div className="absolute inset-0">
                <DrivingScene />
              </div>

              {/* Bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060608]/70 to-transparent pointer-events-none z-10" />

              {/* Top vignette */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#060608]/40 to-transparent pointer-events-none z-10" />

              {/* ── Instructor card floating centre ── */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-20 p-5"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Gentle float bob */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/92 backdrop-blur-md rounded-3xl p-5 w-[270px]"
                  style={{
                    boxShadow: "0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)",
                  }}
                >
                  {/* Instructor header */}
                  <div className="flex items-center gap-3 mb-4">
                    {/* Avatar with rotating ring */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        className="absolute -inset-0.5 rounded-full"
                        style={{ background: "conic-gradient(from 0deg, #E8200A, #FF5500, #E8200A)" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <div
                        className="relative w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base"
                        style={{
                          background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
                        }}
                      >
                        JW
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0D0D0D] text-sm truncate">
                        James Williams
                      </p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.9 + i * 0.07, duration: 0.25, type: "spring", stiffness: 400 }}
                          >
                            <Star size={9} className="fill-amber-400 text-amber-400" />
                          </motion.div>
                        ))}
                        <span className="text-[10px] text-[#6B6B6B] ml-1">4.9</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      Available
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6B6B6B] mb-3">
                    SL1 · SL2 · SL3 · Manual &amp; Automatic
                  </p>

                  <p className="text-[10px] font-bold text-[#0D0D0D] mb-2 uppercase tracking-wider">
                    Available This Week
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Mon 9am","Tue 2pm","Wed 10am","Thu 3pm","Fri 9am","Sat 11am"].map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.0 + i * 0.06, duration: 0.2, type: "spring", stiffness: 380 }}
                        className="text-[10px] text-center py-1.5 bg-[#F5F5F5] rounded-lg text-[#0D0D0D] font-medium"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0D0D0D]">£42 / hour</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="text-xs px-4 py-1.5 text-white rounded-full font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
                        boxShadow: "0 2px 10px rgba(232,32,10,0.35)",
                      }}
                    >
                      Book Now
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Experience badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 1.0, type: "spring", stiffness: 300 }}
                className="absolute top-5 right-5 z-30 bg-[#0D0D0D]/80 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-2xl flex flex-col items-center"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
              >
                <motion.span
                  className="text-lg font-black leading-none"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: "linear-gradient(135deg, #FF5500, #E8200A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  8
                </motion.span>
                <span className="text-[9px] text-white/55 leading-tight tracking-wide mt-0.5">
                  YRS EXP
                </span>
              </motion.div>

              {/* "Just booked" notification */}
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 1.3, type: "spring", stiffness: 260 }}
                className="absolute bottom-5 left-5 z-30 bg-white/90 backdrop-blur-sm rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}
              >
                {/* Ping ripple on checkmark */}
                <div className="relative flex-shrink-0 w-6 h-6">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                  <div className="relative w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#0D0D0D] leading-tight">
                    Lesson booked!
                  </p>
                  <p className="text-[9px] text-[#6B6B6B] leading-tight">
                    2 mins ago · Slough
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="relative z-10 pb-7 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#BBBBBB] font-medium">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={14} className="text-[#BBBBBB]" />
        </motion.div>
      </motion.div>
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
