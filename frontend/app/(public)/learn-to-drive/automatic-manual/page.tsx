"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Award,
  RefreshCw,
  ArrowRight,
  Car,
  Gauge,
  MapPin,
} from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { PublicCategoryPricingCards } from "@/components/pricing/PublicCategoryPricingCards";
import { cn } from "@/lib/utils";

const comparisonRows = [
  { label: "Cost Per Lesson", manual: "£42 / hr", automatic: "£42 / hr" },
  { label: "Pass Rate", manual: "~47% national avg", automatic: "~52% national avg" },
  { label: "Licence Type", manual: "Manual + Automatic", automatic: "Automatic cars only" },
  { label: "Career Flexibility", manual: "Any vehicle type", automatic: "Limited to automatic" },
  { label: "Driving Abroad", manual: "Full flexibility", automatic: "Restricted in many countries" },
];

const gearGuide = [
  {
    letter: "P",
    name: "Park",
    description:
      "The same as neutral, but the wheels are locked. You should be in park when you switch the engine on or off.",
  },
  {
    letter: "D",
    name: "Drive",
    description:
      "Where the fun begins. This is for going forward, and the car will automatically shift through gears as you accelerate.",
  },
  {
    letter: "N",
    name: "Neutral",
    description:
      "You can put the car in neutral when stopped in traffic or at lights — the engine runs but no gear is engaged.",
  },
  {
    letter: "R",
    name: "Reverse",
    description: "Does what it says on the tin — engages the reverse gear so you can back up smoothly.",
  },
];

const guideSections = [
  {
    id: "difference",
    title: "What's the difference between automatic and manual?",
    body: [
      "Automatic and manual refer to the transmission — in other words, the gears. In a manual car, you change gears yourself with a clutch and gear stick. An automatic basically does it for you.",
      "That's not to say you don't have gears in an automatic. They're just more basic. You'll typically see four main options on the gear selector — and that's it.",
    ],
    showGears: true,
    closing:
      "In a manual car, gears are changed using the clutch. Automatic cars don't have a clutch, which means it's much harder to stall. You also won't grind the gears or accidentally select the wrong one.",
  },
  {
    id: "popularity",
    title: "Do more people drive manual or automatic cars?",
    body: [
      "In the UK, manual cars are still the more common choice — but the percentage of newly manufactured automatics is rising sharply, especially as electric vehicles (which are all automatic) become mainstream.",
      "Automatic cars tend to be a little more expensive to buy. Historically they used more fuel and were more complicated to repair, but modern automatics — and EVs in particular — close most of that gap.",
    ],
  },
  {
    id: "when-better",
    title: "When is it better to drive an automatic?",
    body: [
      "If you live in an urban area, driving an automatic can be far more convenient. In stop-start traffic, you don't need to constantly change gears or work the clutch — letting you focus on the road and other vehicles.",
      "If you live somewhere hilly, automatics also help massively. Hill starts are easier because you don't need to find the bite of the clutch, and there's far less risk of rolling backwards on a slope.",
    ],
  },
  {
    id: "quicker",
    title: "Will I get my licence quicker by learning in an automatic?",
    body: [
      "Some learners find that learning in an automatic helps them focus on the road sooner — there's no clutch or gear changes to think about, so the cognitive load drops noticeably.",
      "However, everyone learns at their own pace. Pass-rate data suggests automatic candidates pass slightly more often, but the number of lessons needed before test-readiness varies hugely from person to person.",
    ],
  },
  {
    id: "downside",
    title: "Sounds like a no-brainer. What's the downside?",
    body: [
      "Automatics tend to be more expensive to buy and maintain — and as a result, automatic lessons are often a touch pricier than manual lessons elsewhere (at AutoPilot they're the same price).",
      "There's another, bigger downside. If you pass your test in an automatic, that's all you'll be qualified to drive. Your licence will not cover manual cars unless you take a separate test later.",
      "This can be limiting — especially if you ever need to borrow a car, hire one abroad, or take a job that includes driving. Manuals are still the more common rental and company car, so think carefully before committing.",
    ],
  },
];

const courseCards = [
  {
    icon: Zap,
    title: "Intensive Courses",
    description:
      "AutoPilot has been teaching learners across the UK for over a decade. Our instructors create a personalised lesson plan designed to give you the skills you need to pass your practical test, while becoming a safe, confident motorist.",
    href: "/learn-to-drive/intensive",
  },
  {
    icon: Award,
    title: "Pass Plus Courses",
    description:
      "Pass Plus is a practical training course that takes a minimum of 6 hours to complete. It's designed to help newly qualified drivers build experience on motorways, in poor weather, and in unfamiliar areas.",
    href: "/learn-to-drive/pass-plus",
  },
  {
    icon: RefreshCw,
    title: "Refresher Driving Lessons",
    description:
      "We understand that motorists sometimes need refresher lessons — whether that's after an accident, before a motorway trip, or simply to rebuild confidence. Our instructors tailor every refresher session to your needs.",
    href: "/learn-to-drive/refresher",
  },
];

const quizQuestions = [
  { id: 1, text: "Do you plan to drive abroad often?" },
  { id: 2, text: "Do you want maximum licence flexibility?" },
  { id: 3, text: "Are you on a tight budget?" },
];

function getRecommendation(answers: boolean[]): { type: "Manual" | "Automatic"; reason: string } {
  const [abroad, flexibility, budget] = answers;
  if (abroad || flexibility) {
    return {
      type: "Manual",
      reason:
        "A manual licence gives you the freedom to drive any car, anywhere in the world. It offers maximum flexibility for your career and travels abroad.",
    };
  }
  if (!budget) {
    return {
      type: "Automatic",
      reason:
        "If flexibility isn't your top priority, an automatic transmission is easier to learn and often has a higher pass rate. Great if you just need to get driving quickly.",
    };
  }
  return {
    type: "Manual",
    reason:
      "Manual and automatic lessons are the same price, but a manual licence opens more doors. We recommend starting with manual for the best long-term value.",
  };
}

function Quiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  function handleAnswer(yes: boolean) {
    const newAnswers = [...answers, yes];
    if (current < quizQuestions.length - 1) {
      setAnswers(newAnswers);
      setCurrent(current + 1);
    } else {
      setAnswers(newAnswers);
      setDone(true);
    }
  }

  function reset() {
    setCurrent(0);
    setAnswers([]);
    setDone(false);
  }

  const recommendation = done ? getRecommendation(answers) : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-8">
        {!done ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-8 bg-brand-red text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {current + 1}
                </span>
                <span className="text-xs text-brand-muted">of {quizQuestions.length}</span>
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-6" style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}>
                {quizQuestions[current].text}
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 py-3 border-2 border-brand-border rounded-xl font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 py-3 border-2 border-brand-border rounded-xl font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
                >
                  No
                </button>
              </div>
              <div className="mt-6 flex gap-1.5">
                {quizQuestions.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      i <= current ? "bg-brand-red" : "bg-brand-border"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">✓</span>
              </div>
              <p className="text-sm text-brand-muted uppercase tracking-wider mb-1">Our Recommendation</p>
              <h3
                className="text-3xl font-bold text-brand-black"
                style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
              >
                {recommendation!.type} Lessons
              </h3>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed mb-6 text-center">
              {recommendation!.reason}
            </p>
            <Link
              href="/booking"
              className="block w-full text-center px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200"
            >
              Book {recommendation!.type} Lessons
            </Link>
            <button
              onClick={reset}
              className="block w-full text-center mt-3 text-sm text-brand-muted hover:text-brand-red transition-colors duration-200"
            >
              Retake quiz
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function AutomaticManualPage() {
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Automatic Driving Lessons"
        subtitle="Learn to drive in an automatic with confidence — at a pace that suits you"
        eyebrow="Learn to Drive"
        dark={false}
      />

      {/* Intro Article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Automatic lessons
            </h2>
            <div className="hidden lg:block mt-6 space-y-3 text-sm">
              <a href="#guide" className="block text-brand-muted hover:text-brand-red transition-colors">
                Guide to learning in an automatic
              </a>
              <a href="#difference" className="block text-brand-muted hover:text-brand-red transition-colors">
                Automatic vs manual
              </a>
              <a href="#when-better" className="block text-brand-muted hover:text-brand-red transition-colors">
                When automatic is better
              </a>
              <a href="#instructors" className="block text-brand-muted hover:text-brand-red transition-colors">
                Instructors near you
              </a>
            </div>
          </aside>

          <article className="space-y-5 text-brand-black/80 leading-relaxed">
            <p>
              Learning to drive in a manual car isn&apos;t the right choice for everyone. In busy cities especially,
              managing the gears and clutch can add extra things to think about while you&apos;re still learning the
              fundamentals.
            </p>
            <p>
              With AutoPilot automatic driving lessons, there&apos;s no clutch or gear changes to manage. Many learners
              find this helps them focus on the road, building safe driving skills faster and with less stress.
            </p>
            <p>
              Our DVSA-approved AutoPilot driving instructors offer automatic lessons tailored to your experience —
              helping you learn at a pace that suits you, whether you&apos;re starting from scratch or rebuilding
              confidence.
            </p>

            <h3
              id="guide"
              className="pt-6 text-2xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Guide to learning in an automatic
            </h3>
            <p>
              There are loads of reasons you might choose to learn in an automatic car. A lot of people find it much
              easier than learning in a{" "}
              <Link href="/learn-to-drive" className="text-brand-red font-semibold hover:underline">
                manual
              </Link>
              . And if you have a disability that makes it difficult to change gears, an automatic is a great option.
            </p>
            <p>But is it the right fit for you? Let&apos;s take a closer look.</p>

            {guideSections.map((section) => (
              <div key={section.id} className="space-y-4">
                <h3
                  id={section.id}
                  className="pt-6 text-2xl font-bold text-brand-black"
                  style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
                >
                  {section.title}
                </h3>
                {section.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {section.showGears && (
                  <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gearGuide.map((g) => (
                      <div
                        key={g.letter}
                        className="flex gap-4 items-start bg-brand-surface border border-brand-border rounded-xl p-4"
                      >
                        <div className="w-11 h-11 rounded-lg bg-brand-red text-white font-extrabold flex items-center justify-center shrink-0">
                          {g.letter}
                        </div>
                        <div>
                          <p className="font-bold text-brand-black text-sm">{g.name}</p>
                          <p className="text-sm text-brand-muted leading-relaxed">{g.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {section.closing && <p>{section.closing}</p>}
              </div>
            ))}

            <h3
              id="instructors"
              className="pt-6 text-2xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Automatic driving instructors near you
            </h3>
            <p>
              Our expert AutoPilot instructors deliver automatic driving lessons across the country and create a
              personalised learning plan tailored to your needs. Many learners find that two hours of tuition a week
              helps them build confidence and make steady progress — but it&apos;s entirely your choice, and your
              instructor will adapt lessons to suit you.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors"
            >
              Find an instructor <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 lg:py-20 bg-brand-surface px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Manual vs Automatic — Side by Side
            </h2>
            <p className="text-brand-muted">
              The full picture in numbers — to help you decide which transmission to learn in.
            </p>
          </div>
          <motion.div
            ref={tableRef}
            initial={{ opacity: 0, y: 24 }}
            animate={tableInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="overflow-x-auto rounded-2xl border border-brand-border shadow-sm bg-white"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-black text-white">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold">Manual</th>
                  <th className="px-6 py-4 text-center font-semibold">Automatic</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-brand-surface"}>
                    <td className="px-6 py-4 font-medium text-brand-black">{row.label}</td>
                    <td className="px-6 py-4 text-center text-brand-muted">{row.manual}</td>
                    <td className="px-6 py-4 text-center text-brand-muted">{row.automatic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Course Cards */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Other Driving Courses
            </h2>
            <p className="text-brand-muted">Explore the full range of AutoPilot courses for every stage of your journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courseCards.map((c, i) => {
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

      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl font-bold text-brand-black mb-2 text-center"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Current lesson prices
          </h2>
          <p className="text-center text-brand-muted text-sm mb-10 max-w-xl mx-auto">
            All amounts below are managed in one place — when we update admin pricing, this page and
            the booking checkout stay in sync.
          </p>
          <div className="space-y-14">
            <PublicCategoryPricingCards lessonType="MANUAL" sectionTitle="Manual driving lessons" />
            <PublicCategoryPricingCards lessonType="AUTOMATIC" sectionTitle="Automatic driving lessons" />
          </div>
        </div>
      </section>

      {/* Quiz */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Not Sure? Take Our Quick Quiz
            </h2>
            <p className="text-brand-muted">
              Answer 3 quick questions and we&apos;ll recommend the right transmission for you.
            </p>
          </div>
          <Quiz />
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 bg-white px-4 border-t border-b border-brand-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <Car className="w-8 h-8 text-brand-red mx-auto mb-3" />
            <p className="font-bold text-brand-black">DVSA-Approved Cars</p>
            <p className="text-sm text-brand-muted">All lessons in modern, dual-control automatics</p>
          </div>
          <div>
            <Gauge className="w-8 h-8 text-brand-red mx-auto mb-3" />
            <p className="font-bold text-brand-black">Above-Average Pass Rate</p>
            <p className="text-sm text-brand-muted">Our learners pass first time more often</p>
          </div>
          <div>
            <MapPin className="w-8 h-8 text-brand-red mx-auto mb-3" />
            <p className="font-bold text-brand-black">Local Instructors</p>
            <p className="text-sm text-brand-muted">Available in 350+ towns and cities</p>
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
            Book your automatic driving lesson online
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Check availability and book your first automatic lesson with AutoPilot — no commitment needed.
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
