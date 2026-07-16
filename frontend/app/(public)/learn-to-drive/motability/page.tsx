"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Accessibility, Car, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const articleSections = [
  {
    id: "what",
    title: "What is the Motability Scheme?",
    body: [
      "The Motability Scheme allows people receiving certain disability benefits to exchange part or all of their mobility allowance for the use of a car, scooter or powered wheelchair.",
      "At Autopilot, we're passionate about giving disabled learners the same opportunity to gain independence as any other driver. We work with Motability customers to make learning to drive as accessible and affordable as possible.",
    ],
  },
  {
    id: "who",
    title: "Who is eligible for Motability?",
    body: [
      "You may be eligible for the Motability Scheme if you receive one of the following:",
    ],
    list: [
      "Higher Rate Mobility Component of Disability Living Allowance (DLA)",
      "Enhanced Rate Mobility Component of Personal Independence Payment (PIP)",
      "War Pensioners' Mobility Supplement",
      "Armed Forces Independence Payment",
    ],
    closing:
      "If you're unsure whether you qualify, get in touch with our team and we'll help point you in the right direction.",
    calloutLink: "https://www.motability.org.uk/grants/charitable-grants-available/#FH2",
    calloutText: "to see if you are eligible for funding with Motability.",
  },
  {
    id: "adapted",
    title: "Can Autopilot provide adapted lessons?",
    body: [
      "Yes. We work with instructors experienced in teaching learners with a wide range of physical and learning disabilities, including those who need adapted vehicle controls.",
      "Where needed, we can arrange lessons in vehicles fitted with adaptations such as hand controls, left-foot accelerators, steering aids and swivel seats — tailored to what works best for you.",
    ],
  },
  {
    id: "assessment",
    title: "Do I need a driving assessment first?",
    body: [
      "Many learners with a disability benefit from a specialist driving assessment before starting lessons. This helps identify the right vehicle adaptations and confirms you're fit to learn.",
      "We can help point you towards your nearest Driving Mobility assessment centre, and your Autopilot instructor will build your lesson plan around the assessment's recommendations.",
    ],
  },
  {
    id: "cost",
    title: "Does Motability make lessons more affordable?",
    body: [
      "Autopilot offers discounted lesson bundles for Motability customers, and we'll always talk you through the most cost-effective way to reach test standard.",
      "Get in touch with our team for a tailored quote based on your needs and the adaptations required.",
    ],
  },
];

const supportPoints = [
  {
    icon: Accessibility,
    title: "Adapted Vehicles",
    description:
      "Hand controls, left-foot accelerators, steering balls and swivel seats — fitted to suit your assessment.",
  },
  {
    icon: HeartHandshake,
    title: "Patient, Specialist Instructors",
    description:
      "Instructors experienced with physical and learning disabilities, who adapt their teaching style to you.",
  },
  {
    icon: ShieldCheck,
    title: "DVSA Approved",
    description:
      "Every Autopilot instructor is a fully qualified, DVSA-approved ADI — the same standard for every learner.",
  },
  {
    icon: Car,
    title: "Flexible Lesson Plans",
    description:
      "Lessons built around your assessment recommendations and your own pace of learning.",
  },
];

const faqs = [
  {
    value: "how-apply",
    trigger: "How do I apply to the Motability Scheme?",
    content:
      "You apply through the benefit that makes you eligible (DLA, PIP, War Pensioners' Mobility Supplement or Armed Forces Independence Payment). Once accepted, Motability will help you choose a car, scooter or powered wheelchair.",
  },
  {
    value: "car-choice",
    trigger: "Can I learn to drive in my own Motability car?",
    content:
      "In many cases, yes — subject to insurance and instructor availability. Speak to our team and we'll confirm what's possible with your specific vehicle and adaptations.",
  },
  {
    value: "learner-driver",
    trigger: "Can I get a car through Motability before I've passed my test?",
    content:
      "The Motability Scheme is generally for licence holders, but some learners arrange a vehicle in advance ready for when they pass. We can advise on timing your lessons around this.",
  },
];

export default function MotabilityPage() {
  return (
    <>
      <PageHero
        title="Learn with Autopilot"
        subtitle="Supporting disabled learners to gain independence on the road through the Motability Scheme."
        dark={false}
        eyebrow="Motability"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Driving lessons through Motability
            </h2>
            <div className="hidden lg:block mt-6 space-y-3 text-sm">
              {articleSections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block text-brand-muted hover:text-brand-red transition-colors">
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
                  {section.list && (
                    <ul className="list-disc list-inside space-y-1.5 text-brand-black/85">
                      {section.list.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  )}
                  {section.closing && <p>{section.closing}</p>}
                  {section.calloutLink && (
                    <div className="border border-brand-border rounded-xl px-5 py-4 text-sm">
                      <a
                        href={section.calloutLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange font-semibold hover:underline"
                      >
                        Click Here
                      </a>{" "}
                      {section.calloutText}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-3 px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors"
            >
              Talk to our team <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* How we support you */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How Autopilot Supports Motability Learners
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              Every learner deserves the chance to become a safe, confident, independent driver.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportPoints.map((point, i) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-brand-border"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2">{point.title}</h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{point.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Common Questions
            </h2>
            <p className="text-brand-muted">What Motability learners most often ask us.</p>
          </div>
          <Accordion className="border border-brand-border rounded-2xl overflow-hidden">
            {faqs.map((item) => (
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
            Ready to get started?
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Tell us about your Motability needs and we&apos;ll match you with the right instructor and vehicle.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            Contact Us <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
