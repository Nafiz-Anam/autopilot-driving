"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Check, MapPin, Clock, Search } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import type { InstructorPublic } from "@/types";
import { backendApiUrl } from "@/lib/backend-api";
import { cn, getInitials } from "@/lib/utils";
import { BookingNavButtons } from "@/components/booking/BookingNavButtons";

/* ── Skeleton card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border-2 border-brand-border bg-white animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

/* ── Availability badge ─────────────────────────────────────── */
type AvailStatus = "available" | "limited" | "full";

function AvailBadge({ status }: { status: AvailStatus }) {
  const map: Record<AvailStatus, { dot: string; label: string; text: string }> = {
    available: { dot: "bg-green-500", label: "Available this week", text: "text-green-700" },
    limited: { dot: "bg-amber-400", label: "Limited availability", text: "text-amber-700" },
    full: { dot: "bg-red-500", label: "Fully booked", text: "text-red-600" },
  };
  const { dot, label, text } = map[status];
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

/* ── Helper: derive fake availability from id hash ─────────── */
function deriveAvailability(id: string): AvailStatus {
  const code = id.charCodeAt(id.length - 1);
  if (code % 5 === 0) return "full";
  if (code % 3 === 0) return "limited";
  return "available";
}

/* ── Main component ─────────────────────────────────────────── */
export function Step2Instructor() {
  const { selectedInstructor, setInstructor, nextStep, prevStep, lessonType } = useBookingStore();
  const transmissionFilter =
    lessonType === "MANUAL" ? "manual" : lessonType === "AUTOMATIC" ? "automatic" : null;
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [postcode, setPostcode] = useState("");
  const [instructors, setInstructors] = useState<InstructorPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadInstructors() {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get<{ success: boolean; data: InstructorPublic[] }>(
        backendApiUrl("/public/instructors")
      );
      if (data.success) {
        setInstructors(data.data);
      }
    } catch {
      setError("Could not load instructors. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInstructors();
  }, []);

  const filteredInstructors = instructors.filter((inst) => {
    if (transmissionFilter) {
      if (!(inst.transmission ?? []).some((t) => t.toLowerCase() === transmissionFilter)) return false;
    }
    if (femaleOnly && !inst.isFemale) return false;
    const q = postcode.trim().toLowerCase();
    if (!q) return true;
    const name = (inst.user.name ?? "").toLowerCase();
    const areas = (inst.areas ?? []).join(" ").toLowerCase();
    return name.includes(q) || areas.includes(q);
  });

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Choose your instructor
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          {transmissionFilter
            ? `Showing ${transmissionFilter} instructors only. Search by name or area/postcode to narrow further.`
            : "All instructors are shown below. Use search to quickly filter by name or area/postcode."}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
            placeholder="Filter by instructor name or area/postcode (e.g. IG1, Romford)"
            className="w-full pl-10 pr-4 py-3 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm uppercase tracking-wide"
            maxLength={32}
          />
        </div>
        <button
          type="button"
          onClick={() => setFemaleOnly((v) => !v)}
          className={cn(
            "shrink-0 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors duration-150 whitespace-nowrap",
            femaleOnly
              ? "bg-brand-red border-brand-red text-white"
              : "border-brand-border text-brand-muted hover:border-brand-red hover:text-brand-red bg-white"
          )}
        >
          Female instructor
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loading && instructors.length === 0 && (
        <div className="text-center py-12 mb-8 bg-brand-surface border border-brand-border rounded-2xl">
          <p className="font-semibold text-brand-black mb-1">No instructors available right now</p>
          <p className="text-sm text-brand-muted">Please try again shortly.</p>
        </div>
      )}
      {!loading && instructors.length > 0 && filteredInstructors.length === 0 && (
        <div className="text-center py-12 mb-8 bg-brand-surface border border-brand-border rounded-2xl">
          <p className="font-semibold text-brand-black mb-1">No instructors match "{postcode}"</p>
          <p className="text-sm text-brand-muted">Try a broader area or part of the instructor name.</p>
        </div>
      )}

      {/* Instructor cards */}
      {!loading && filteredInstructors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {filteredInstructors.map((inst, i) => {
            const selected = selectedInstructor?.id === inst.id;
            const avail = deriveAvailability(inst.id);
            const isFullyBooked = avail === "full";
            const initials = inst.user.name ? getInitials(inst.user.name) : "??";

            return (
              <motion.button
                key={inst.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileHover={
                  !isFullyBooked ? { y: -3, boxShadow: "0 8px 24px rgba(232,32,10,0.12)" } : {}
                }
                onClick={() => !isFullyBooked && setInstructor(inst)}
                disabled={isFullyBooked}
                className={cn(
                  "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red",
                  selected
                    ? "border-brand-red bg-red-50/60"
                    : isFullyBooked
                    ? "border-brand-border bg-gray-50 opacity-60 cursor-not-allowed"
                    : "border-brand-border bg-white hover:border-brand-red/40"
                )}
              >
                {/* Selected checkmark */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    {inst.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inst.user.image}
                        alt={inst.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-brand-black text-sm truncate">{inst.user.name}</h3>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  {/* Transmission pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {inst.transmission.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-semibold",
                          t.toLowerCase() === "manual"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Areas */}
                  <div className="flex items-start gap-1.5 text-xs text-brand-muted">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="leading-tight">
                      {inst.areas.slice(0, 3).join(", ")}
                    </span>
                  </div>

                  {/* Exp */}
                  <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{inst.yearsExp} years experience</span>
                  </div>

                  {/* Price + availability */}
                  <div className="flex items-center justify-between pt-1 border-t border-brand-border">
                    <span className="text-lg font-extrabold text-brand-red">
                      £{inst.pricePerHour}
                      <span className="text-xs font-medium text-brand-muted">/hr</span>
                    </span>
                    <AvailBadge status={avail} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Navigation */}
      <BookingNavButtons
        onBack={prevStep}
        onContinue={nextStep}
        canContinue={!!selectedInstructor}
      />
    </div>
  );
}
