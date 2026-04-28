"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { PostcodeSearch } from "@/components/shared/PostcodeSearch";
import { ArrowRight } from "lucide-react";

const areas = [
  "Slough", "Windsor", "Maidenhead", "Reading", "Wokingham",
  "Bracknell", "Staines", "Feltham", "Hounslow",
];

export function AreaTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-brand-red py-20 lg:py-28 px-4">
      <div className="max-w-7xl mx-auto text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <p className="text-white/70 uppercase tracking-widest text-sm font-medium mb-3">
            Coverage
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            We Cover Your Area
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Operating across East Berkshire, West London and surrounding areas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2.5 mb-10"
        >
          {areas.map((area) => (
            <span
              key={area}
              className="px-4 py-1.5 rounded-full border border-white/30 text-white text-sm font-medium"
            >
              {area}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-md mx-auto mb-6"
        >
          <PostcodeSearch
            placeholder="Check your postcode..."
            buttonLabel="Check Coverage"
            variant="white"
            redirectTo="/areas"
          />
        </motion.div>

        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 text-white underline underline-offset-4 text-sm font-medium hover:text-white/80 transition-colors"
        >
          See all areas <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
