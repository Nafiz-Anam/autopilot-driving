"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";
import { ArrowRight, MapPin } from "lucide-react";

const areas = [
  "Slough",
  "Windsor",
  "Maidenhead",
  "Reading",
  "Wokingham",
  "Bracknell",
  "Staines",
  "Feltham",
  "Hounslow",
];

export function AreaTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-[#0D0D0D] py-20 lg:py-28 px-4 overflow-hidden relative">
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Top edge accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8200A]/25 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — text + search */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
          >
            <p className="text-[#FF5500] uppercase tracking-widest text-xs font-semibold mb-4">
              Coverage
            </p>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              style={{
                fontFamily: "'Moderniz', 'Barlow', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              We Cover Your Area
            </h2>
            <p className="text-[#8A8A8A] text-lg mb-8 leading-relaxed">
              Operating across East Berkshire, West London and surrounding
              areas.
            </p>

            <div className="max-w-md mb-6">
              <PostcodeSearch
                placeholder="Check your postcode..."
                buttonLabel="Check Coverage"
                variant="white"
                redirectTo="/areas"
              />
            </div>

            <Link
              href="/areas"
              className="inline-flex items-center gap-1.5 text-[#666666] hover:text-white text-sm font-medium transition-colors duration-200 group"
            >
              See all areas
              <ArrowRight
                size={13}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </motion.div>

          {/* Right — area pills */}
          <div className="relative">
            {/* Decorative map pin bg */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full flex items-center justify-center pointer-events-none">
              <MapPin size={80} className="text-[#E8200A]/8" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              {areas.map((area, i) => (
                <motion.div
                  key={area}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.07 }}
                >
                  <Link
                    href={`/areas/${area.toLowerCase()}`}
                    className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[#AAAAAA] text-sm font-medium hover:border-[#E8200A]/40 hover:text-white hover:bg-[#E8200A]/8 transition-all duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8200A] opacity-50 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                    {area}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
