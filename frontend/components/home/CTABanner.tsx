"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-brand-black py-16 px-4">
      <div className="max-w-4xl mx-auto text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            Ready to Start Your Journey?
          </h2>
          <p className="text-brand-muted text-lg mb-8 max-w-xl mx-auto">
            Book your first lesson today and take the wheel of your future.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/booking"
              className="flex items-center gap-2 px-8 py-3.5 bg-brand-red text-white font-bold rounded-full hover:bg-brand-orange transition-colors duration-200"
            >
              Book a Lesson <ArrowRight size={18} />
            </Link>
            <a
              href="tel:07944722168"
              className="flex items-center gap-2 px-8 py-3.5 border-2 border-white/20 text-white font-medium rounded-full hover:border-white/40 transition-colors"
            >
              <Phone size={16} /> Call Us Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
