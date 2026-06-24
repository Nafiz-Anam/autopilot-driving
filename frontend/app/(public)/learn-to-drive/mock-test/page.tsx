"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  ClipboardCheck,
  Compass,
  Smile,
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
    icon: ClipboardCheck,
    title: "Test-Ready Learners",
    description:
      "Nearly there? A mock test is the clearest signal of whether you're ready to book the real thing — under realistic conditions.",
  },
  {
    icon: Smile,
    title: "Nervous Drivers",
    description:
      "Settle your nerves. Walk through every step of test day so the real examiner holds no surprises.",
  },
  {
    icon: Compass,
    title: "Independent Drivers",
    description:
      "Practise following sat-nav directions and road signs for 30 minutes of independent driving — exactly like the real test.",
  },
];

const whatWeCover = [
  "Driving licence and eyesight check",
  "'Show me, tell me' vehicle safety questions",
  "Rural roads, urban roads and dual carriageways",
  "Multi-lane roundabouts and one-way systems",
  "Reversing manoeuvres",
  "30 minutes of independent driving",
  "Emergency stop practice",
  "Full result and feedback at the end",
];

const articleSections = [
  {
    id: "why",
    title: "Why take a mock driving test?",
    body: [
      "You'd never take an exam without doing a few mock exam papers first. And you probably took more than one mock theory test before taking the real thing.",
      "Taking a mock driving test is a great way of checking you have all the skills you need to drive safely on your own. It'll also help you understand if you're ready to take your driving test.",
    ],
  },
  {
    id: "whats-included",
    title: "What's included in a mock test?",
    body: [
      "It should take about 40 minutes and include everything covered during a normal driving test. This includes:",
    ],
    showChecklist: true,
    bodyAfter: [
      "Mock tests work best when they include all the parts of the real driving test.",
      "The emergency stop may not be included in your actual driving test — it's used in around 1 in 3 tests. At AutoPilot we think it's a good idea to practise it in a mock test.",
    ],
  },
  {
    id: "routes",
    title: "Will I use a real test route?",
    body: [
      "AutoPilot will use routes that contain similar types of roads to an actual driving test. You will not use an actual driving test route — examiners change routes regularly, and the goal is to test your judgement, not your memory.",
    ],
  },
  {
    id: "nerves",
    title: "Settle your nerves",
    body: [
      "Going into your practical blind can turn even a confident driver into a nervous wreck. By taking a mock driving test, you no longer have to let your imagination run wild — you'll know exactly how the day will go.",
    ],
  },
  {
    id: "format",
    title: "Get used to the test format",
    body: [
      "Once you've gone through the actual process of the driving test, you won't be surprised by anything the examiner asks you to do — for example, a 'show me' question whilst you're driving on a dual carriageway.",
    ],
  },
  {
    id: "strengths",
    title: "Figure out your strengths and weaknesses",
    body: [
      "If your instructor is using a feedback sheet, they'll be noting down every slight miscalculation and mistake — giving you a clear list of what to work on before your actual test.",
      "You'll leave the mock with a focused plan: what's already solid, what to drill, and whether you're ready to book.",
    ],
    cta: { text: "Book a mock test", href: "/booking" },
  },
];

const otherCourses = [
  {
    icon: Zap,
    title: "Intensive Courses",
    description:
      "Personalised lesson plans designed to give you the skills you need to pass your practical driving test, while becoming a safe, confident motorist.",
    href: "/learn-to-drive/intensive-courses",
  },
  {
    icon: Accessibility,
    title: "Refresher Lessons",
    description:
      "A perfect way to improve specific skills, boost road safety, or rebuild confidence behind the wheel after time away from driving.",
    href: "/learn-to-drive/refresher-lessons",
  },
  {
    icon: Award,
    title: "Pass Plus",
    description:
      "A practical training course designed for newly qualified drivers to improve their skills on motorways, in poor weather, and on rural roads.",
    href: "/learn-to-drive/pass-plus",
  },
];

export default function MockTestPage() {
  const audienceRef = useRef(null);
  const audienceInView = useInView(audienceRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Learn with AutoPilot"
        subtitle="Mock driving tests to check you're ready for the real thing — under realistic conditions."
        dark={false}
        eyebrow="Mock Driving Test"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Mock Driving Test
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
                  {section.showChecklist && (
                    <ul className="list-disc list-inside space-y-1.5 pl-1">
                      {whatWeCover.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.bodyAfter?.map((p, i) => (
                    <p key={`after-${i}`}>{p}</p>
                  ))}
                  {section.cta && (
                    <p>
                      Ready to put it to the test?{" "}
                      <Link href={section.cta.href} className="text-brand-red font-semibold hover:underline">
                        {section.cta.text}
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            ))}

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
              Who Should Take a Mock Test?
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              Anyone preparing for their practical — and anyone who wants to walk in feeling calm and certain.
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
              What a Mock Test Covers
            </h2>
            <p className="text-brand-muted">Around 40 minutes, mirroring every part of the real driving test.</p>
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

      {/* Pricing */}
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
          <PublicCategoryPricingCards lessonType="MOCK_TEST" />
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
            Book your mock driving test
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Walk into your real test feeling calm, prepared, and confident.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            Book Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
