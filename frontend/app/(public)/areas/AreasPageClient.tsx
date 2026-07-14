"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { PageHero } from "@/components/shared/PageHero";
import { backendApiUrl } from "@/lib/backend-api";
import { cn } from "@/lib/utils";

interface AreaData {
  id: string;
  name: string;
  postcodePrefix: string;
  description: string | null;
}

interface CoverageResult {
  covered: boolean;
  area?: { name: string; postcodePrefix: string };
}

function PostcodeChecker() {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get<{ success: boolean; data: CoverageResult }>(
        backendApiUrl(`/public/areas?postcode=${encodeURIComponent(postcode.trim())}`)
      );
      if (data.success) {
        setResult(data.data);
      } else {
        setError("Could not check coverage. Please try again.");
      }
    } catch {
      setError("Could not check coverage. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16 bg-brand-surface px-4">
      <div className="max-w-xl mx-auto text-center">
        <h2
          className="text-3xl font-bold text-brand-black mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Check Your Postcode
        </h2>
        <p className="text-brand-muted mb-8">
          Enter your postcode to see if we offer lessons in your area.
        </p>
        <form onSubmit={handleCheck} className="flex gap-3">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Enter prefix of your postcode. E.G: IG1"
            className="flex-1 px-5 py-3 border border-brand-border rounded-full text-brand-black bg-white focus:outline-none focus:ring-2 focus:ring-brand-red text-sm placeholder:text-sm uppercase"
            maxLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? "Checking…" : "Check Coverage"}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-6 p-5 rounded-2xl text-center",
              result.covered
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-brand-red"
            )}
          >
            {result.covered ? (
              <>
                <p className="font-bold text-lg">Great news! We cover your area.</p>
                <p className="text-sm mt-1">
                  {result.area?.name} ({result.area?.postcodePrefix}) is one of our active coverage zones.
                </p>
                <Link
                  href={`/booking?postcode=${postcode}`}
                  className="mt-3 inline-block px-6 py-2 bg-brand-red text-white rounded-full font-semibold text-sm hover:bg-brand-orange transition-colors duration-200"
                >
                  Book a Lesson
                </Link>
              </>
            ) : (
              <>
                <p className="font-bold text-lg">Sorry, we don&apos;t cover this area yet.</p>
                <p className="text-sm mt-1">
                  Leave your details and we&apos;ll notify you when we expand.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-block px-6 py-2 bg-brand-red text-white rounded-full font-semibold text-sm hover:bg-brand-orange transition-colors duration-200"
                >
                  Contact Us
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function AreaCards({ areas }: { areas: AreaData[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl lg:text-4xl font-bold text-brand-black mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Our Coverage Areas
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto">
            We have DVSA-approved instructors across these areas. Click to book in your area.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area, i) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-brand-black">{area.name}</h3>
                  <span className="text-xs font-semibold text-brand-red bg-red-50 px-2 py-0.5 rounded-full">
                    {area.postcodePrefix}
                  </span>
                </div>
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {area.postcodePrefix.slice(0, 4)}
                </div>
              </div>
              <p className="text-sm text-brand-muted mb-4">{area.description}</p>
              <Link
                href={`/booking?postcode=${area.postcodePrefix}`}
                className="text-sm font-semibold text-brand-red hover:text-brand-orange transition-colors duration-200"
              >
                Book in {area.name} →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AreasPageClient() {
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAreas() {
      try {
        const { data } = await axios.get<{ success: boolean; data: AreaData[] }>(
          backendApiUrl("/public/areas")
        );
        if (data.success) {
          setAreas(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch areas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAreas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <>
      <PageHero title="We Cover Your Area" dark={true} />
      <PostcodeChecker />
      <AreaCards areas={areas} />
    </>
  );
}
