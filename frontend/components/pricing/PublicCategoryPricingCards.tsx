"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LessonType } from "@/types";
import type { PublicPricingPackage } from "@/lib/lesson-pricing-public";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";

const HEADING = { fontFamily: "var(--font-display)" } as const;

/**
 * Renders admin-managed packages for one lesson category (used on learn-to-drive pages).
 */
export function PublicCategoryPricingCards({
  lessonType,
  sectionTitle,
  variant = "per-hour",
}: {
  lessonType: LessonType;
  sectionTitle?: string;
  variant?: "per-hour" | "total";
}) {
  const [pkgs, setPkgs] = useState<PublicPricingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(backendApiUrl(`/pricing/packages?lessonType=${lessonType}`), { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { success?: boolean; data?: PublicPricingPackage[] }) => {
        if (!cancelled && d.success && d.data) {
          setPkgs([...d.data].sort((a, b) => a.price - b.price));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonType]);

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-brand-muted" aria-busy>
        Loading prices…
      </div>
    );
  }

  if (!pkgs.length) return null;

  return (
    <div className="w-full">
      {sectionTitle && (
        <h3
          className="text-xl font-bold text-brand-black mb-6 text-center"
          style={HEADING}
        >
          {sectionTitle}
        </h3>
      )}
      <div className={cn(
        "grid gap-4",
        variant === "total"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-3"
      )}>
        {pkgs.map((p, i) => {
          if (variant === "total") {
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "rounded-2xl p-6 flex flex-col",
                  p.isPopular
                    ? "border-2 border-brand-red shadow-md bg-white scale-[1.02]"
                    : "border border-brand-border bg-white shadow-sm"
                )}
              >
                {p.isPopular && (
                  <span className="text-[10px] font-bold text-white bg-brand-red uppercase tracking-wider px-2 py-1 rounded-full w-fit mb-3">
                    {p.badge ?? "Popular"}
                  </span>
                )}
                <p className="text-sm font-bold text-brand-black mb-1">{p.name}</p>
                <div className="flex items-baseline gap-0.5 mb-3">
                  <span className="text-2xl font-bold text-brand-black" style={HEADING}>£</span>
                  <span className="text-4xl font-extrabold text-brand-black" style={HEADING}>
                    {Number.isInteger(p.price) ? p.price : p.price.toFixed(2)}
                  </span>
                </div>
                {p.footerNote && (
                  <p className="text-sm text-brand-muted leading-relaxed mt-auto">{p.footerNote}</p>
                )}
              </motion.div>
            );
          }

          const pph =
            p.pricePerHour ??
            (p.hours > 0 ? Math.round((p.price / p.hours) * 100) / 100 : p.price);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "rounded-2xl p-5 flex flex-col",
                p.isPopular
                  ? "border-2 border-brand-red shadow-md bg-white scale-[1.02]"
                  : "border border-brand-border bg-white shadow-sm"
              )}
            >
              {p.isPopular && (
                <span className="text-[10px] font-bold text-white bg-brand-red uppercase tracking-wider px-2 py-1 rounded-full w-fit mb-2">
                  {p.badge ?? "Popular"}
                </span>
              )}
              <p className="text-xs font-semibold text-brand-red uppercase tracking-wider">{p.name}</p>
              <div className="flex items-end gap-1 mt-1 mb-2">
                <span className="text-4xl font-extrabold text-brand-black" style={HEADING}>
                  £{pph}
                </span>
                <span className="text-sm text-brand-muted mb-1">/ hour</span>
              </div>
              {p.savings != null && p.savings > 0 && (
                <span className="text-xs font-bold text-brand-orange mb-2">Save £{p.savings}</span>
              )}
              <p className="text-sm text-brand-muted mt-auto">{p.footerNote}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <Link
          href={`/booking?lessonType=${lessonType}`}
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange transition-colors"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
