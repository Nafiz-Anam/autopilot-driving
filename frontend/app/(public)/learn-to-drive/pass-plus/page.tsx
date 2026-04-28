"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const modules = [
  {
    value: "town",
    title: "Module 1 — Town Driving",
    description:
      "Develop confidence in busy urban environments — traffic lights, pedestrian crossings, one-way systems, and complex junctions.",
  },
  {
    value: "weather",
    title: "Module 2 — All-Weather Driving",
    description:
      "Learn to handle rain, fog, ice, and wind safely. Understand stopping distances, visibility, and vehicle behaviour in poor conditions.",
  },
  {
    value: "out-of-town",
    title: "Module 3 — Out of Town",
    description:
      "Rural roads, national speed limit routes, and country lanes. Focus on overtaking, anticipation, and reading the road ahead.",
  },
  {
    value: "night",
    title: "Module 4 — Night Driving",
    description:
      "Gain experience driving after dark — headlight use, judging distances, hazard perception, and fatigue awareness.",
  },
  {
    value: "dual",
    title: "Module 5 — Dual Carriageways",
    description:
      "Join, exit, and navigate dual carriageways confidently. Cover lane discipline, overtaking safely, and high-speed hazards.",
  },
  {
    value: "motorway",
    title: "Module 6 — Motorway Driving",
    description:
      "The final module — motorway joining and exiting, smart motorways, lane discipline, breakdown procedures, and maintaining alertness at speed.",
  },
];

const insurerTypes = [
  "Direct Line",
  "Aviva",
  "Admiral",
  "Churchill",
  "Hastings Direct",
];

export default function PassPlusPage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Pass Plus Programme"
        subtitle="Go beyond the basics. Advanced training designed to make you a safer, more confident driver."
        dark={true}
        eyebrow="Post-Test Training"
      />

      {/* What is Pass Plus */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-4"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              What is Pass Plus?
            </h2>
          </div>
          <div className="prose text-brand-muted max-w-none text-center leading-relaxed">
            <p>
              Pass Plus is a nationally recognised training programme developed by the DVSA. It consists of
              6 modules that take newly qualified drivers beyond the basics covered in the standard driving test.
            </p>
            <p className="mt-4">
              There is <strong className="text-brand-black">no test at the end</strong> — you pass by completing
              all 6 modules to the required standard. The whole course takes approximately 6 hours and costs just £150.
            </p>
          </div>
        </div>
      </section>

      {/* Modules Accordion */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              The 6 Modules
            </h2>
            <p className="text-brand-muted">Each module covers real-world driving scenarios you won&apos;t have covered in your standard lessons.</p>
          </div>
          <Accordion className="border border-brand-border rounded-2xl overflow-hidden bg-white">
            {modules.map((mod) => (
              <AccordionItem key={mod.value} value={mod.value} className="border-brand-border">
                <AccordionTrigger className="px-6 font-semibold text-brand-black text-left">
                  {mod.title}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-brand-muted text-sm">
                  {mod.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Insurance Savings */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <h2
                className="text-3xl font-bold text-brand-black mb-4"
                style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
              >
                Save on Your Car Insurance
              </h2>
              <p className="text-brand-muted leading-relaxed mb-6">
                Many insurance companies offer discounts for Pass Plus certificate holders. As a new driver,
                this could save you hundreds of pounds on your first year of insurance.
              </p>
              <ul className="space-y-2">
                {insurerTypes.map((insurer) => (
                  <li key={insurer} className="flex items-center gap-2 text-sm text-brand-black">
                    <CheckCircle className="w-4 h-4 text-brand-red flex-shrink-0" />
                    {insurer}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-brand-muted">
                * Discounts vary by insurer. Contact your insurance provider for eligibility.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-brand-surface rounded-2xl p-8 border border-brand-border text-center"
            >
              <p className="text-sm text-brand-muted uppercase tracking-wider mb-2">Course Price</p>
              <div className="text-6xl font-extrabold text-brand-red mb-2">£150</div>
              <ul className="text-sm text-brand-muted space-y-2 text-left mt-6">
                {[
                  "6 comprehensive modules",
                  "No test at the end",
                  "DVSA-approved certificate",
                  "Potential insurance discounts",
                  "Same instructor as your lessons",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-red flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/booking"
                className="mt-8 block text-center px-6 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
              >
                Book Pass Plus
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-black px-4 text-center text-white">
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Become a Safer Driver
        </h2>
        <p className="text-brand-muted mb-8">Book your Pass Plus course today and take your driving to the next level.</p>
        <Link
          href="/booking"
          className="inline-block px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
        >
          Book Pass Plus — £150
        </Link>
      </section>
    </>
  );
}
