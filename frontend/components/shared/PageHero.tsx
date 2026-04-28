"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  titleHighlight?: string;
  subtitle?: string;
  className?: string;
  dark?: boolean;
  children?: React.ReactNode;
}

export function PageHero({
  eyebrow,
  title,
  titleHighlight,
  subtitle,
  className,
  dark = true,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "py-20 lg:py-28 px-4",
        dark ? "bg-[#0D0D0D] text-white" : "bg-[#E8200A] text-white",
        className
      )}
    >
      <div className="max-w-4xl mx-auto text-center">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[#FF5500] uppercase tracking-widest text-sm font-medium mb-4"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
          style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif" }}
        >
          {title}
          {titleHighlight && (
            <span className={dark ? " text-[#E8200A]" : " text-[#0D0D0D]"}>
              {" "}{titleHighlight}
            </span>
          )}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className={cn("text-lg max-w-2xl mx-auto", dark ? "text-[#6B6B6B]" : "text-white/80")}
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
