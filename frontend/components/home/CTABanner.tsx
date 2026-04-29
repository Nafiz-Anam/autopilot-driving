"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-16 sm:py-20 md:py-24 px-4 overflow-hidden">
      {/* Red gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #C41808 0%, #E8200A 40%, #FF3A1A 80%, #FF5500 100%)",
        }}
      />

      {/* Diagonal stripe overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px)",
        }}
      />

      {/* Radial light bloom */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,120,60,0.35) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(140,12,4,0.4) 0%, transparent 100%)",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-white/60 uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Get Started Today
          </p>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
            style={{
              fontFamily: "'Moderniz', 'Barlow', sans-serif",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 20px rgba(0,0,0,0.2)",
            }}
          >
            Ready to Start
            <br />
            Your Journey?
          </h2>

          <p className="text-white/70 text-xl mb-10 max-w-lg mx-auto leading-relaxed">
            Book your first lesson today and take the wheel of your future.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/booking"
              className="group flex items-center gap-2.5 px-9 py-4 bg-white text-[#E8200A] font-bold rounded-full text-base transition-all duration-200 hover:bg-[#FFF5F5]"
              style={{
                boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              Book a Lesson
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>

            <a
              href="tel:07944722168"
              className="flex items-center gap-2.5 px-9 py-4 border-2 border-white/30 text-white font-semibold rounded-full text-base hover:border-white/60 hover:bg-white/10 transition-all duration-200"
            >
              <Phone size={16} />
              07944 722168
            </a>
          </div>

          <p className="text-white/40 text-sm mt-8">
            No commitment required &middot; Free first consultation
          </p>
        </motion.div>
      </div>
    </section>
  );
}
