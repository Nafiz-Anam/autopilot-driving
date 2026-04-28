"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Passed first time! My instructor was incredibly patient and professional. The booking system made everything so easy.",
    name: "Sarah Mitchell",
    passed: "March 2025",
  },
  {
    quote:
      "I was nervous about driving but my instructor from AutoPilot completely put me at ease. Couldn't recommend more highly.",
    name: "James O'Connor",
    passed: "January 2025",
  },
  {
    quote:
      "The intensive course was brilliant — passed my test in just 2 weeks. Great value for money too.",
    name: "Priya Patel",
    passed: "February 2025",
  },
  {
    quote:
      "As someone who had failed twice before, AutoPilot gave me the confidence I needed. Passed with only 2 minors!",
    name: "Daniel Thompson",
    passed: "April 2025",
  },
  {
    quote:
      "Excellent female instructor who made me feel completely comfortable. Passed first time after just 25 hours.",
    name: "Aisha Rahman",
    passed: "March 2025",
  },
];

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [autoplayPlugin.current]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28 px-4">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#FF5500] uppercase tracking-widest text-sm font-medium mb-3">
            Student Stories
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D]"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            What Our Students Say
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white rounded-2xl p-6 border border-[#E5E5E5] shadow-sm"
                >
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[#0D0D0D] italic text-sm leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-bold text-[#0D0D0D] text-sm">{t.name}</p>
                    <p className="text-[#6B6B6B] text-xs">Passed {t.passed}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === selectedIndex ? "w-6 bg-[#E8200A]" : "w-2 bg-[#E5E5E5]"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
