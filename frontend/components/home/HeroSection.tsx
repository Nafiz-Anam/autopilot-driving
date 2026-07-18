"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";

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
    <section className="relative min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-5rem)] flex flex-col overflow-hidden bg-white">
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
      <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-14 items-center w-full">

          {/* ── LEFT ── */}
          <div>
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
              style={{ fontFamily: "var(--font-display)" }}
            >
              Learn to Drive
              <br />
              with{" "}
              <span className="relative inline-flex h-[1em] overflow-hidden align-bottom leading-none min-w-[12ch] md:min-w-[12ch] lg:min-w-[13ch]">
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
              className="text-base md:text-lg lg:text-xl text-[#6B6B6B] max-w-lg mb-6 leading-relaxed"
            >
              Find a DVSA-approved instructor near you and book your first
              lesson in under 60 seconds.
            </motion.p>

            {/* Postcode search */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="max-w-lg mb-8"
            >
              <p className="text-sm text-[#6B6B6B] mb-3">
                Enter your postcode to see if we offer lessons in your area.
              </p>
              <PostcodeSearch
                placeholder="Enter prefix of your postcode. E.G: IG1"
                buttonLabel="Check Coverage"
                redirectTo="/booking"
                checkCoverage
              />
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
                label="5/5 Rating"
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

          {/* ── RIGHT — Hero image ── */}
          <motion.div
            className=""
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link href="/booking?lessonType=MOCK_TEST" className="block cursor-pointer">
              <Image
                src="/hero-image.png"
                alt="Book a mock driving test"
                width={700}
                height={700}
                priority
                className="w-full h-auto object-contain"
              />
            </Link>
          </motion.div>
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
