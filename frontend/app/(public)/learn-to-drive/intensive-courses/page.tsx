"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const articleSections = [
  {
    id: "pace",
    title: "Learn to drive at a pace that works for you",
    body: [
      "At AutoPilot, we believe learning to drive should focus on building the skills, confidence and awareness needed to become a safe driver — not just passing a test.",
      "Some learners prefer to take lessons more frequently so they can practise regularly and build their skills sooner. Others prefer a more gradual approach. Our DVSA-approved instructors tailor lessons to suit each learner's pace and experience.",
      "Your instructor will only recommend booking your driving test once they're confident you're ready.",
    ],
  },
  {
    id: "quicker",
    title: "Want to learn more quickly?",
    body: [
      "One option is to take lessons more frequently over a shorter period of time.",
      "These are often called intensive driving courses. They might involve sessions lasting between two and five hours, taken over several days or weeks.",
      "For some learners, this approach helps them focus on developing key driving skills through regular, concentrated practice — and reach test standard far faster than weekly lessons allow.",
    ],
  },
  {
    id: "block",
    title: "Block booking lessons",
    body: [
      "If you'd like to take lessons more regularly without committing to a full intensive week, you can book lessons in blocks. These are typically taken as two-hour sessions, giving you time to practise and build your confidence on the road.",
      "Regular block lessons help you develop driving skills step by step — and tend to attract a small per-hour discount versus single bookings.",
    ],
  },
  {
    id: "when-test",
    title: "When can I book my driving test?",
    body: ["There is no minimum number of lessons required before booking your practical driving test."],
    list: ["A valid provisional driving licence", "Proof that you've passed your theory test"],
    listLeadIn: "To book your test, you'll need:",
    closing: "Your AutoPilot instructor will help you decide when you're ready to take your test.",
  },
  {
    id: "how-quickly",
    title: "How quickly can I get my licence?",
    body: [
      "Driving test availability can vary depending on where you live. In many areas, test centres can be booked several weeks or even months in advance.",
      "Because of this, it's helpful to consider local test availability when planning your lessons — your instructor can advise on the quickest realistic timeline for your area.",
    ],
  },
  {
    id: "guarantee",
    title: "Do intensive driving courses guarantee a pass?",
    body: [
      "No driving course can guarantee a pass.",
      "All learner drivers must pass the same DVSA practical driving test. The result depends on your performance on the day and the number of faults recorded by the examiner.",
      "Your instructor will work with you to build the skills and confidence needed before booking your test.",
    ],
  },
  {
    id: "how-many",
    title: "How many lessons do most learners take?",
    body: [
      "Everyone learns differently. Some learners progress quickly, while others prefer more time to build confidence — both are completely valid.",
      "You could start with a 10-hour lesson bundle, after which your instructor can help you decide what might work best for the rest of your journey to test day.",
    ],
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

const steps = [
  {
    num: 1,
    title: "Assessment Call",
    description:
      "We chat with you to assess your current level, set realistic goals, and match you with the right instructor.",
  },
  {
    num: 2,
    title: "Book Your Week",
    description:
      "Choose your start date. We block your instructor for the full course and arrange your theory if needed.",
  },
  {
    num: 3,
    title: "Daily Lessons",
    description:
      "Typically 4–6 hours per day. Each session builds on the last, giving you rapid progress and confidence.",
  },
  {
    num: 4,
    title: "Test Day",
    description:
      "Your practical test is booked at the end of your course. Your instructor gives you a full pre-test briefing.",
  },
];

const packages = [
  {
    id: "1week",
    name: "1-Week Intensive",
    hours: "20 hours",
    price: 680,
    perHour: "£34/hr",
    savings: "Save £160",
    popular: false,
    notes: "Best for those with some previous experience",
  },
  {
    id: "2week",
    name: "2-Week Intensive",
    hours: "30 hours",
    price: 900,
    perHour: "£30/hr",
    savings: "Save £360",
    popular: true,
    badge: "Best Value",
    notes: "Our most popular intensive option",
  },
  {
    id: "custom",
    name: "Bespoke Course",
    hours: "Custom",
    price: null,
    perHour: null,
    savings: null,
    popular: false,
    notes: "Tailored to your exact needs and availability",
  },
];

const prerequisites = [
  {
    value: "age",
    trigger: "Age requirement (17+)",
    content:
      "You must be at least 17 years old to drive a car on UK roads. We can arrange your lessons to begin on your 17th birthday.",
  },
  {
    value: "licence",
    trigger: "Must hold a provisional licence",
    content:
      "You need a valid UK provisional driving licence before starting lessons. Apply via the DVLA — it takes around 1 week to arrive.",
  },
  {
    value: "theory",
    trigger: "Theory test recommended",
    content:
      "We strongly recommend passing your theory test before starting an intensive course. This reduces anxiety and keeps your practical test accessible throughout.",
  },
  {
    value: "experience",
    trigger: "No previous driving experience needed",
    content:
      "Complete beginners are welcome on our intensive courses. Our instructors are experienced at getting first-timers up to test standard quickly.",
  },
];

const testimonials = [
  {
    name: "Jordan T.",
    quote:
      "I passed first time after a 2-week intensive. My instructor was patient, organised, and pushed me just the right amount. Couldn't believe how quickly I progressed.",
    course: "2-Week Intensive",
    location: "Slough",
  },
  {
    name: "Amelia K.",
    quote:
      "I needed to drive for a new job and had 3 weeks. Chose the 20-hour intensive and passed with just 2 minors. The structured daily lessons made a huge difference.",
    course: "1-Week Intensive",
    location: "Reading",
  },
];

export default function IntensiveCoursesPage() {
  const packagesRef = useRef(null);
  const packagesInView = useInView(packagesRef, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Learn with AutoPilot"
        subtitle="Structured daily lessons with a dedicated instructor — the fastest route to your UK driving licence."
        dark={false}
        eyebrow="Intensive Driving Courses"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Intensive driving lessons
            </h2>
            <div className="hidden lg:block mt-6 space-y-3 text-sm">
              {articleSections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block text-brand-muted hover:text-brand-red transition-colors">
                  {s.title}
                </a>
              ))}
              <a href="#near-you" className="block text-brand-muted hover:text-brand-red transition-colors">
                Intensive lessons near you
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
                  {section.listLeadIn && <p>{section.listLeadIn}</p>}
                  {section.list && (
                    <ul className="list-disc list-inside space-y-1.5 text-brand-black/85">
                      {section.list.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  )}
                  {section.closing && <p>{section.closing}</p>}
                </div>
              </div>
            ))}

            <h3
              id="near-you"
              className="text-2xl font-bold text-brand-black mb-3 scroll-mt-24"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Intensive driving lessons near you
            </h3>
            <p className="mb-3">
              Wherever you are in the UK, you shouldn&apos;t be too far from our network of expert AutoPilot instructors.
              Popular locations include{" "}
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

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              How It Works
            </h2>
            <p className="text-brand-muted">Four steps from enquiry to passing your test.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-brand-red text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-brand-black mb-2">{step.title}</h3>
                <p className="text-sm text-brand-muted">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Course Packages
            </h2>
          </div>
          <div ref={packagesRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 24 }}
                animate={packagesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  "bg-white rounded-2xl p-6 flex flex-col shadow-sm",
                  pkg.popular ? "border-2 border-brand-red" : "border border-brand-border"
                )}
              >
                {pkg.popular && (
                  <span className="self-start bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {pkg.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold text-brand-black mb-1" style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}>
                  {pkg.name}
                </h3>
                <p className="text-sm text-brand-muted mb-4">{pkg.hours}</p>
                {pkg.price ? (
                  <>
                    <div className="text-4xl font-extrabold text-brand-black mb-1">£{pkg.price}</div>
                    <div className="text-sm text-brand-muted mb-1">{pkg.perHour}</div>
                    {pkg.savings && (
                      <span className="text-xs font-semibold text-brand-orange">{pkg.savings}</span>
                    )}
                  </>
                ) : (
                  <div className="text-2xl font-bold text-brand-black mb-1">Contact us</div>
                )}
                <p className="text-sm text-brand-muted mt-3 flex-1">{pkg.notes}</p>
                <Link
                  href="/booking"
                  className="mt-6 block text-center px-6 py-2.5 bg-brand-red text-white rounded-full hover:bg-brand-orange transition-colors duration-200 font-semibold text-sm"
                >
                  Book This Course
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Before You Book
            </h2>
            <p className="text-brand-muted">What you need to know before starting an intensive course.</p>
          </div>
          <Accordion className="border border-brand-border rounded-2xl overflow-hidden">
            {prerequisites.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="border-brand-border">
                <AccordionTrigger className="px-6 text-left font-semibold text-brand-black">
                  {item.trigger}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-brand-muted text-sm">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              What Our Students Say
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm">
                <p className="text-brand-muted text-sm italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-brand-black text-sm">{t.name}</p>
                  <p className="text-xs text-brand-muted">{t.course} · {t.location}</p>
                </div>
              </div>
            ))}
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
            Ready to start learning?
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Book your lessons today and begin building the skills you need to become a safe, confident driver.
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
