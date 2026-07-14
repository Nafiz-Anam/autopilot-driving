"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Gauge,
  Route,
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
    icon: Route,
    title: "Learner Drivers",
    description:
      "Since June 2018, learners in England, Scotland and Wales can take motorway lessons with a qualified instructor in a dual-controlled car.",
  },
  {
    icon: ShieldCheck,
    title: "Newly Qualified",
    description:
      "Just passed your test but never driven on a motorway? Build confidence at speed with structured guidance from an Autopilot instructor.",
  },
  {
    icon: Gauge,
    title: "Returning Drivers",
    description:
      "Avoided motorways since passing? We'll help you get familiar with lane discipline, joining, overtaking and safe stopping distances.",
  },
];

const whatWeCover = [
  "Joining and leaving the motorway safely",
  "Lane discipline and overtaking",
  "Safe following distances at higher speeds",
  "Reading motorway signs and gantry signals",
  "Smart motorways and variable speed limits",
  "What to do in a breakdown or emergency",
];

const articleSections = [
  {
    id: "confidence",
    title: "Build confidence driving on the motorway",
    body: [
      "Driving on the motorway is an important skill for many UK drivers. It can feel daunting at first, particularly if you're new to driving or haven't used motorways before.",
      "Motorway lessons with an Autopilot instructor can help you become familiar with motorway driving in a calm, structured way while building confidence on faster roads.",
    ],
  },
  {
    id: "instructors",
    title: "Instructors to help you gain motorway experience",
    body: [
      "Autopilot instructors can support you as you develop your motorway driving skills. With guidance and practice, you can learn how to handle motorway traffic safely and confidently.",
      "Whether you're preparing for your first motorway journey or would simply like more experience, you can search for an Autopilot instructor near you.",
    ],
  },
  {
    id: "learners",
    title: "Can learners drive on the motorway?",
    body: [
      "Yes. Since June 2018, learner drivers in England, Scotland and Wales have been allowed to take motorway lessons.",
      "However, motorway driving lessons must:",
    ],
    showRules: true,
    bodyAfter: [
      "Learners in Northern Ireland are currently not permitted to drive on motorways.",
    ],
  },
  {
    id: "after-test",
    title: "Can I take motorway lessons after passing my test?",
    body: [
      "Yes. Motorway lessons are available to anyone who holds a full driving licence.",
      "Some drivers may not have much motorway experience after passing their test, particularly if they live in areas where motorways are less common. Refresher motorway lessons can help drivers build confidence and practise motorway skills with an instructor.",
    ],
  },
  {
    id: "stay-safe",
    title: "How can I stay safe when driving on the motorway?",
    body: [
      "Remaining calm and focused is important when driving on motorways, where traffic may be travelling at higher speeds.",
      "Many drivers will already have experience on dual carriageways before driving on a motorway, and motorway lessons can help you build on these skills with support from your instructor.",
    ],
  },
  {
    id: "lane",
    title: "Which lane should I drive in?",
    body: [
      "Unless you are overtaking, you should normally drive in the left-hand lane.",
      "Motorways have a left-hand lane and overtaking lanes. The right-hand lanes should only be used when overtaking slower vehicles or when directed by road signs.",
      "Driving unnecessarily in the middle lane (sometimes called \"middle-lane hogging\") can be considered careless driving and may result in a fine and penalty points.",
    ],
  },
  {
    id: "speed",
    title: "What is the motorway speed limit?",
    body: [
      "For most vehicles, the national speed limit on motorways is 70 mph.",
      "However, lower speed limits may apply in certain situations, such as:",
    ],
    showSpeedReasons: true,
    bodyAfter: [
      "Always follow the speed limits shown on motorway signs and adjust your speed to suit road conditions.",
    ],
  },
  {
    id: "distance",
    title: "How much distance should I leave between vehicles?",
    body: [
      "At motorway speeds it can be harder to judge braking distances, so maintaining a safe following distance is important.",
      "Drivers are generally advised to leave at least a two-second gap between their vehicle and the one in front.",
      "In wet or poor weather conditions, you should increase this distance to allow more time to react and stop safely.",
    ],
  },
];

const learnerRules = [
  "Be taken with a qualified driving instructor",
  "Be in a dual-controlled vehicle",
];

const speedReasons = ["Roadworks", "Congestion", "Poor weather conditions"];

const otherCourses = [
  {
    icon: Zap,
    title: "Intensive Courses",
    description:
      "Autopilot has been teaching learners across the UK for years. Our instructors create a personalised lesson plan designed to give you the skills you need to pass your practical driving test.",
    href: "/learn-to-drive/intensive-courses",
  },
  {
    icon: Accessibility,
    title: "Refresher Lessons",
    description:
      "Refresher driving lessons are a perfect way to improve specific skills, boost road safety, or rebuild confidence behind the wheel after time away from driving.",
    href: "/learn-to-drive/refresher-lessons",
  },
  {
    icon: Award,
    title: "Pass Plus",
    description:
      "Pass Plus is a practical training course that takes a minimum of 6 hours to complete and is designed for newly qualified drivers to improve their skills on motorways, in poor weather, and on rural roads.",
    href: "/learn-to-drive/pass-plus",
  },
];

export default function MotorwayLessonsPage() {
  const audienceRef = useRef(null);
  const audienceInView = useInView(audienceRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Learn with Autopilot"
        subtitle="Motorway driving lessons to build confidence and skill on faster roads."
        dark={false}
        eyebrow="Motorway Driving Lessons"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Motorway Driving Lessons
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
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {section.showRules && (
                    <ul className="list-disc list-inside space-y-1.5 pl-1">
                      {learnerRules.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {section.showSpeedReasons && (
                    <ul className="list-disc list-inside space-y-1.5 pl-1">
                      {speedReasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {section.bodyAfter?.map((p, i) => (
                    <p key={`after-${i}`}>{p}</p>
                  ))}
                </div>
              </div>
            ))}

            <Link
              href="/booking?lessonType=MOTORWAY"
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
              style={{ fontFamily: "var(--font-display)" }}
            >
              Who Are Motorway Lessons For?
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              From learners to seasoned drivers, motorway lessons help you feel at home on faster roads.
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
              style={{ fontFamily: "var(--font-display)" }}
            >
              What a Motorway Lesson Covers
            </h2>
            <p className="text-brand-muted">Structured guidance from joining the slip road to safely leaving at your exit.</p>
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
            style={{ fontFamily: "var(--font-display)" }}
          >
            Simple Pricing
          </h2>
          <p className="text-sm text-brand-muted mb-8 max-w-lg mx-auto">
            Live pricing — same bundles power this page and checkout.
          </p>
          <PublicCategoryPricingCards lessonType="MOTORWAY" />
        </div>
      </section>

      {/* Other courses */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Explore Other Courses
            </h2>
            <p className="text-brand-muted">More ways to build your driving skills with Autopilot.</p>
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
            style={{ fontFamily: "var(--font-display)" }}
          >
            Book motorway lessons today
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Check availability and book your first motorway lesson with Autopilot today.
          </p>
          <Link
            href="/booking?lessonType=MOTORWAY"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            Book Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
