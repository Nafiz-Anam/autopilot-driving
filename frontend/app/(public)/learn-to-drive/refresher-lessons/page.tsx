"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Clock, Globe, Heart, CheckCircle } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const audiences = [
  {
    icon: Clock,
    title: "Lapsed Drivers",
    description:
      "Passed years ago but barely driven since? We help you rebuild your skills and confidence in a structured, pressure-free environment.",
  },
  {
    icon: Heart,
    title: "Nervous Drivers",
    description:
      "Anxiety behind the wheel is more common than you think. Our patient instructors specialise in supporting nervous learners at your own pace.",
  },
  {
    icon: Globe,
    title: "Moved from Abroad",
    description:
      "New to UK roads or converting a foreign licence? We'll familiarise you with UK road rules, roundabouts, and motorway driving.",
  },
];

const whatWeCover = [
  "City driving and busy junctions",
  "Motorway and dual carriageway driving",
  "Parking techniques (parallel, bay, reverse bay)",
  "Roundabouts and complex road layouts",
  "Dual carriageways and A-road driving",
  "Night driving and low-visibility conditions",
];

export default function RefresherLessonsPage() {
  const audienceRef = useRef(null);
  const audienceInView = useInView(audienceRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Back Behind the Wheel"
        subtitle="Whether you're rusty, nervous, or returning from abroad — we've got you."
        dark={true}
        eyebrow="Refresher Lessons"
      />

      {/* Target Audiences */}
      <section className="py-16 lg:py-24 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Who Are Refresher Lessons For?
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              No matter where you&apos;ve been or what&apos;s held you back, we&apos;ll meet you where you are.
            </p>
          </div>
          <div ref={audienceRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audiences.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={audienceInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-brand-surface rounded-2xl p-6 border border-brand-border"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2">{a.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{a.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Cover */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              What a Refresher Lesson Covers
            </h2>
            <p className="text-brand-muted">We tailor every lesson to your specific needs — no cookie-cutter sessions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whatWeCover.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-brand-border"
              >
                <CheckCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
                <span className="text-sm font-medium text-brand-black">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-brand-black mb-8"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Simple Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border text-center">
              <p className="text-sm text-brand-muted mb-2">Single Refresher Lesson</p>
              <div className="text-4xl font-extrabold text-brand-black mb-1">£42</div>
              <p className="text-xs text-brand-muted">1 hour with a qualified instructor</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-brand-red text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full">
                Save £15
              </span>
              <p className="text-sm text-brand-muted mb-2">Block of 5 Lessons</p>
              <div className="text-4xl font-extrabold text-brand-black mb-1">£195</div>
              <p className="text-xs text-brand-muted">£39/hr — best for rebuilding fully</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-black px-4 text-center text-white">
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Take the First Step
        </h2>
        <p className="text-brand-muted mb-8">Book your refresher lesson and get back on the road today.</p>
        <Link
          href="/booking"
          className="inline-block px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
        >
          Book a Refresher Lesson
        </Link>
      </section>
    </>
  );
}
