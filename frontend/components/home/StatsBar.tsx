"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 94, suffix: "%", label: "First-Time Pass Rate", decimals: 0 },
  { value: 2000, suffix: "+", label: "Students Passed", decimals: 0 },
  { value: 4.9, suffix: "/5", label: "Average Rating", decimals: 1 },
  { value: 8, suffix: "+", label: "Years Experience", decimals: 0 },
];

function CountUp({
  to,
  suffix,
  decimals,
  active,
}: {
  to: number;
  suffix: string;
  decimals: number;
  active: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = 80;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = () => {
      frame++;
      const progress = easeOut(Math.min(frame / totalFrames, 1));
      setCount(parseFloat((to * progress).toFixed(decimals)));
      if (frame < totalFrames) requestAnimationFrame(tick);
      else setCount(to);
    };

    requestAnimationFrame(tick);
  }, [active, to, decimals]);

  return (
    <>
      {count.toFixed(decimals)}
      {suffix}
    </>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0D0D0D] py-14 px-4 overflow-hidden relative">
      {/* Top separator line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8200A]/30 to-transparent" />

      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center relative"
            >
              {/* Divider for desktop */}
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-[#2A2A2A]" />
              )}

              <div
                className="text-4xl lg:text-5xl font-black mb-1.5 tabular-nums"
                style={{
                  background:
                    "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <CountUp
                  to={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  active={isInView}
                />
              </div>
              <p className="text-[#666666] text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#2A2A2A] to-transparent" />
    </section>
  );
}
