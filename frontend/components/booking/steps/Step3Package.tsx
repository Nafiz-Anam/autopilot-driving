"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Loader2 } from "lucide-react";
import axios from "axios";
import { useBookingStore } from "@/store/bookingStore";
import { publicPackageToBookingPackage, type PublicPricingPackage } from "@/lib/lesson-pricing-public";
import type { Package } from "@/types";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";
import { BookingNavButtons } from "@/components/booking/BookingNavButtons";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function Step3Package() {
  const { lessonType, selectedPackage, setPackage, nextStep, prevStep } = useBookingStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lessonType) {
      setPackages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    axios
      .get<{ success: boolean; data?: PublicPricingPackage[] }>(
        backendApiUrl(`/pricing/packages?lessonType=${lessonType}`)
      )
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.success || !data.data?.length) {
          setPackages([]);
          setError("No packages configured for this lesson type. Please contact support.");
          return;
        }
        const list = data.data.map(publicPackageToBookingPackage);
        setPackages(list);

        const sel = useBookingStore.getState().selectedPackage;
        if (sel && !list.some((p) => p.id === sel.id)) {
          useBookingStore.getState().setPackage(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load prices. Please try again.");
          setPackages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonType]);

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Choose your package
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Block bookings save you money — spread lessons over time at your own pace.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          <p className="text-sm text-brand-muted">Loading current prices…</p>
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-8">{error}</p>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {packages.map((pkg) => {
            const selected = selectedPackage?.id === pkg.id;

            return (
              <motion.button
                key={pkg.id}
                variants={cardVariant}
                type="button"
                onClick={() => setPackage(pkg)}
                whileHover={{ y: -3, boxShadow: "0 8px 28px rgba(232,32,10,0.13)" }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative text-left p-6 rounded-2xl border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red",
                  selected
                    ? "border-brand-red bg-red-50/60"
                    : pkg.isPopular
                      ? "border-brand-orange/60 bg-orange-50/30 hover:border-brand-red/50"
                      : "border-brand-border bg-white hover:border-brand-red/40"
                )}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3.5 left-4 inline-flex items-center gap-1 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    {pkg.badge ?? "Most Popular"}
                  </span>
                )}

                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute top-4 right-4 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mb-3 pr-8">
                  <h3 className="font-bold text-brand-black text-base">{pkg.name}</h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {pkg.lessons === 1 ? "1 lesson" : `${pkg.lessons} lessons`}
                    {" · "}
                    {pkg.hours === 1 ? "1 hour" : `${pkg.hours} hours`}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-brand-black">£{pkg.price}</span>
                  {pkg.lessons > 1 && pkg.pricePerLesson != null && (
                    <span className="text-sm text-brand-muted">£{pkg.pricePerLesson}/lesson</span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const ratePerHour = pkg.pricePerHour ?? (pkg.hours ? Math.round(pkg.price / pkg.hours) : null);
                    return ratePerHour != null ? (
                      <span className="text-xs font-semibold text-brand-muted bg-brand-surface border border-brand-border px-2 py-0.5 rounded-full">
                        £{ratePerHour}/hr
                      </span>
                    ) : null;
                  })()}
                  {pkg.savings > 0 ? (
                    <p className="text-sm font-bold text-brand-orange">Save £{pkg.savings}</p>
                  ) : (
                    <p className="text-sm text-brand-muted">Standard rate</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <BookingNavButtons
        onBack={prevStep}
        onContinue={nextStep}
        canContinue={!!selectedPackage && !loading && !error}
      />
    </div>
  );
}
