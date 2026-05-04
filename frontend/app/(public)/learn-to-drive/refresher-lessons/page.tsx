"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  Globe,
  Heart,
  CheckCircle,
  ArrowRight,
  Zap,
  Accessibility,
  Award,
} from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { PublicCategoryPricingCards } from "@/components/pricing/PublicCategoryPricingCards";

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

const refresherTopics = [
  { label: "Night driving", href: null },
  { label: "Motorway driving", href: "/learn-to-drive/motorway" },
  { label: "Roundabouts", href: null },
  { label: "Parking (reverse manoeuvre)", href: null },
  { label: "Traffic signs", href: null },
  { label: "Speed awareness", href: null },
  { label: "Confidence building", href: null },
  { label: "Switching to an automatic vehicle", href: "/learn-to-drive/automatic-manual" },
];

const articleSections = [
  {
    id: "what",
    title: "What are refresher driving lessons?",
    body: [
      "Refresher driving lessons are a perfect way to improve specific skills, bump up your road safety, or boost your confidence behind the wheel.",
      "We understand there are many reasons drivers seek refresher lessons — from needing reassurance after time away from driving, to rebuilding confidence after an accident, to feeling steadier on a motorway or at night. That's why our AutoPilot instructors listen to your needs and tailor your course accordingly.",
    ],
  },
  {
    id: "topics",
    title: "Do refresher courses include night-time or motorway driving lessons?",
    body: [
      "Yes, if that's what you need. There are many areas of driving you can cover during your refresher lessons — here are just a few:",
    ],
    showTopics: true,
  },
  {
    id: "specify",
    title: "Can I specify what I'd like to cover during my refresher lessons?",
    body: [
      "Of course you can. Our AutoPilot instructors know there are many reasons drivers of all ages come to us for refresher lessons — which is why they listen to your requirements and tailor your refresher course accordingly.",
      "Whether you want to focus on a single skill or build a broader programme, your instructor will design lessons that match your goals.",
    ],
  },
  {
    id: "length",
    title: "How long is a driving refresher course?",
    body: [
      "That's entirely down to you. If you're getting back into driving after some time off — or you've just passed your test but feel a little nervous behind the wheel — we usually recommend booking around 5 hours of instruction to make sure you're getting the most from your experience.",
      "If you need more time, we can easily top you up for a few more hours. Lessons are completely flexible.",
    ],
  },
  {
    id: "price",
    title: "How much are refresher lessons?",
    body: [
      "The cost of refresher lessons differs across the country. Single AutoPilot refresher lessons start from £42/hr, with a 5-lesson block at £195 (£39/hr) for those rebuilding skills more fully.",
    ],
    cta: { text: "Get a quote online", href: "/booking" },
  },
];

const popularLocations = [
  "Birmingham",
  "Bristol",
  "Cardiff",
  "Leeds",
  "Leicester",
  "Liverpool",
  "London",
  "Manchester",
  "Nottingham",
  "Sheffield",
];

const otherCourses = [
  {
    icon: Zap,
    title: "Intensive Courses",
    description:
      "AutoPilot has been teaching learners across the UK for years. Our instructors create a personalised lesson plan designed to give you the skills you need to pass your practical driving test, while becoming a safe, confident motorist.",
    href: "/learn-to-drive/intensive-courses",
  },
  {
    icon: Accessibility,
    title: "Motability",
    description:
      "We have a passion for providing opportunities for people with disabilities to gain independence as drivers. AutoPilot partners with the Motability scheme to make the learning process easier and more affordable.",
    href: "/learn-to-drive/motability",
  },
  {
    icon: Award,
    title: "Pass Plus",
    description:
      "Pass Plus is a practical training course that takes a minimum of 6 hours to complete and is designed for newly qualified drivers to improve their skills on motorways, in poor weather, and on rural roads.",
    href: "/learn-to-drive/pass-plus",
  },
];

export default function RefresherLessonsPage() {
  const audienceRef = useRef(null);
  const audienceInView = useInView(audienceRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Learn with AutoPilot"
        subtitle="Refresher driving lessons to rebuild confidence and sharpen your skills behind the wheel."
        dark={false}
        eyebrow="Refresher Driving Lessons"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Refresher Lessons, Improve your Driving Skills
            </h2>
            <div className="hidden lg:block mt-6 space-y-3 text-sm">
              {articleSections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-brand-muted hover:text-brand-red transition-colors"
                >
                  {s.title}
                </a>
              ))}
              <a href="#near-you" className="block text-brand-muted hover:text-brand-red transition-colors">
                Refresher lessons near me
              </a>
            </div>
          </aside>

          <article className="text-brand-black/80 leading-relaxed">
            {articleSections.map((section) => (
              <div key={section.id} className="mb-8">
                <h3
                  id={section.id}
                  className="text-2xl font-bold text-brand-black mb-3 scroll-mt-24"
                  style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
                >
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {section.showTopics && (
                    <ul className="list-disc list-inside space-y-1.5 pl-1">
                      {refresherTopics.map((t) => (
                        <li key={t.label}>
                          {t.href ? (
                            <Link href={t.href} className="text-brand-red font-semibold hover:underline">
                              {t.label}
                            </Link>
                          ) : (
                            <span>{t.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.cta && (
                    <p>
                      For a price in your area,{" "}
                      <Link href={section.cta.href} className="text-brand-red font-semibold hover:underline">
                        {section.cta.text}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            ))}

            <h3
              id="near-you"
              className="text-2xl font-bold text-brand-black mb-3 scroll-mt-24"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Refresher driving lessons near me
            </h3>
            <p className="mb-3">
              Our expert AutoPilot instructors offer refresher driving lessons all over the UK, so we&apos;ll have you
              covered wherever you are. Some of our more popular areas include{" "}
              {popularLocations.map((loc, i) => (
                <span key={loc}>
                  <Link
                    href={`/locations/${loc.toLowerCase()}`}
                    className="text-brand-red font-semibold hover:underline"
                  >
                    {loc}
                  </Link>
                  {i < popularLocations.length - 2 ? ", " : i === popularLocations.length - 2 ? " and " : "."}
                </span>
              ))}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 mt-3 px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors"
            >
              Find an instructor <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-16 bg-brand-surface px-4">
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
                  className="bg-white rounded-2xl p-6 border border-brand-border"
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
      <section className="py-16 bg-white px-4">
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
                className="flex items-center gap-3 bg-brand-surface rounded-xl p-4 border border-brand-border"
              >
                <CheckCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
                <span className="text-sm font-medium text-brand-black">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — admin-managed REFRESHER packages */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-brand-black mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Simple Pricing
          </h2>
          <p className="text-sm text-brand-muted mb-8 max-w-lg mx-auto">
            Live pricing — same bundles power this page and checkout.
          </p>
          <PublicCategoryPricingCards lessonType="REFRESHER" />
        </div>
      </section>

      {/* Other courses */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Explore Other Courses
            </h2>
            <p className="text-brand-muted">More ways to build your driving skills with AutoPilot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherCourses.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-brand-surface rounded-2xl p-6 border border-brand-border flex flex-col"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-extrabold text-brand-black text-lg mb-3">{c.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed mb-6">{c.description}</p>
                  <Link
                    href={c.href}
                    className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-full font-semibold text-sm hover:bg-brand-orange transition-colors"
                  >
                    More Info <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-12">
        <div
          className="max-w-6xl mx-auto rounded-3xl px-6 py-12 text-center text-white"
          style={{ background: "linear-gradient(120deg, #E8200A 0%, #FF5500 100%)" }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Book your refresher lessons online
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Check availability and book your first refresher lesson with AutoPilot today.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            See Prices <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
