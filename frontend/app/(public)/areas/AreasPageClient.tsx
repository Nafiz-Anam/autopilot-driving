"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import axios from "axios";
import { PageHero } from "@/components/shared/PageHero";
import { cn } from "@/lib/utils";

const AREAS = [
  {
    name: "Slough",
    postcode: "SL1",
    prefix: "SL1",
    description: "SL1–SL3",
    districts: "Town Centre, Cippenham, Langley, Colnbrook",
  },
  {
    name: "Windsor",
    postcode: "SL4",
    prefix: "SL4",
    description: "SL4",
    districts: "Windsor, Eton, Old Windsor, Datchet",
  },
  {
    name: "Maidenhead",
    postcode: "SL6",
    prefix: "SL6",
    description: "SL6",
    districts: "Maidenhead, Bray, Cox Green, Furze Platt",
  },
  {
    name: "Reading",
    postcode: "RG1",
    prefix: "RG1",
    description: "RG1–RG7",
    districts: "Reading town, Caversham, Tilehurst, Earley",
  },
  {
    name: "Wokingham",
    postcode: "RG40",
    prefix: "RG40",
    description: "RG40–RG41",
    districts: "Wokingham, Finchampstead, Arborfield",
  },
  {
    name: "Bracknell",
    postcode: "RG12",
    prefix: "RG12",
    description: "RG12",
    districts: "Bracknell, Sandhurst, Crowthorne",
  },
  {
    name: "Staines",
    postcode: "TW18",
    prefix: "TW18",
    description: "TW18–TW19",
    districts: "Staines-upon-Thames, Stanwell, Ashford",
  },
  {
    name: "Feltham",
    postcode: "TW13",
    prefix: "TW13",
    description: "TW13–TW14",
    districts: "Feltham, Hanworth, Bedfont",
  },
  {
    name: "Hounslow",
    postcode: "TW3",
    prefix: "TW3",
    description: "TW3–TW6",
    districts: "Hounslow, Isleworth, Heston, Heathrow",
  },
];

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
        `/api/areas?postcode=${encodeURIComponent(postcode.trim())}`
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
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
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
            placeholder="e.g. SL1 2AB"
            className="flex-1 px-5 py-3 border border-brand-border rounded-full text-brand-black bg-white focus:outline-none focus:ring-2 focus:ring-brand-red text-lg uppercase"
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
        {error && (
          <p className="mt-4 text-red-600 text-sm">{error}</p>
        )}
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
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function AreaCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl lg:text-4xl font-bold text-brand-black mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Our Coverage Areas
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto">
            We have DVSA-approved instructors across these areas. Click to book in your area.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {AREAS.map((area, i) => (
            <motion.div
              key={area.postcode}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-brand-black">{area.name}</h3>
                  <span className="text-xs font-semibold text-brand-red bg-red-50 px-2 py-0.5 rounded-full">
                    {area.description}
                  </span>
                </div>
                <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {area.prefix}
                </div>
              </div>
              <p className="text-sm text-brand-muted mb-4">{area.districts}</p>
              <Link
                href={`/booking?postcode=${area.postcode}`}
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
  return (
    <>
      <PageHero title="We Cover Your Area" dark={true} />
      <PostcodeChecker />
      <AreaCards />

      {/* Map Section */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Find Us on the Map
            </h2>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-brand-border">
            <iframe
              src="https://maps.google.com/maps?q=Slough+SL1&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
