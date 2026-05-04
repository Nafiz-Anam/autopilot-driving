"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Star, Shield, Award, ThumbsUp, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { PublicCategoryPricingCards } from "@/components/pricing/PublicCategoryPricingCards";
import { cn } from "@/lib/utils";

const articleIntro = [
  "If you've recently received your provisional driving licence, the next step is usually to start thinking about driving lessons.",
  "Choosing the right driving instructor is an important decision and can make a real difference to your learning experience. While many learners simply choose the nearest instructor available, others may prefer to learn with a female driving instructor.",
  "Feeling comfortable with your instructor is important. You'll spend a significant amount of time together, so finding an instructor who suits your learning style can really help.",
  "Below, we explain what to consider when choosing a driving instructor and how AutoPilot can support learners who prefer a female instructor.",
];

const articleSections = [
  {
    id: "difference",
    title: "What's the difference between a male and female instructor?",
    body: [
      "In practice, there should be no difference in the quality of instruction. All DVSA-approved driving instructors are trained to teach safely, professionally and patiently.",
      "The most important factors when choosing an instructor are their professionalism, teaching approach and ability to adapt lessons to your learning style.",
    ],
  },
  {
    id: "can-i",
    title: "Can I learn with a female driving instructor at AutoPilot?",
    body: [
      "Yes. If you would prefer to learn with a female driving instructor, we'll do our best to match you with one where available.",
      "Some learners simply feel more comfortable learning with a female instructor. Others may prefer this for personal, cultural or religious reasons. Whatever your preference, we aim to be as accommodating as possible.",
      "If you've already tried lessons with one instructor and would like to try a different teaching style, we'll also do our best to support that.",
    ],
  },
  {
    id: "fewer",
    title: "Are there fewer female driving instructors?",
    body: [
      "Across the UK there are around 40,000 DVSA Approved Driving Instructors (ADIs). It's estimated that roughly a quarter of them are women.",
      "Because of this, female instructors may be less widely available in some areas — but we will always try to accommodate requests wherever possible.",
    ],
  },
  {
    id: "should",
    title: "Should I choose a female instructor?",
    body: [
      "That's entirely your decision.",
      "If you would prefer a female instructor, we'll do our best to assign one where available. However, whichever instructor you learn with, you can expect the same professional approach and structured lessons designed to support your progress.",
      "All AutoPilot instructors are either fully qualified DVSA Approved Driving Instructors (green badge), or in the final stages of qualifying (pink badge). Both badges are displayed in the windscreen so you know your instructor is DVSA-recognised.",
    ],
  },
  {
    id: "switch",
    title: "Changing instructors if needed",
    body: [
      "Learning to drive works best when you feel comfortable with your instructor.",
      "That's why AutoPilot offers a free instructor switch policy. If you feel that your instructor isn't the right fit for any reason, we can arrange for you to change instructors at no extra cost.",
      "Our goal is to help you build the confidence, skills and awareness needed to become a safe driver — for life.",
    ],
  },
];

const instructors = [
  {
    initials: "SA",
    name: "Sarah Ahmed",
    yearsExp: 5,
    areas: ["SL4", "SL6", "RG1"],
    transmission: ["Automatic"],
    rating: 4.8,
    reviewCount: 84,
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    yearsExp: 3,
    areas: ["TW18", "TW19"],
    transmission: ["Manual", "Automatic"],
    rating: 5.0,
    reviewCount: 52,
  },
];

const trustBadges = [
  { icon: Shield, label: "DBS Checked" },
  { icon: Award, label: "DVSA Approved" },
  { icon: ThumbsUp, label: "5-Star Rated" },
];

const requestSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^(\+44|0)7\d{9}$/, "Enter a valid UK mobile number"),
  postcode: z.string().min(3, "Postcode required"),
  preferredDay: z.string().min(1, "Please select a day"),
  preferredTime: z.string().min(1, "Please select a time"),
});

type RequestInput = z.infer<typeof requestSchema>;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-4 h-4", s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")}
        />
      ))}
      <span className="ml-1 text-sm text-brand-muted">{rating.toFixed(1)}</span>
    </div>
  );
}

function RequestForm() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestInput>({ resolver: zodResolver(requestSchema) });

  async function onSubmit(data: RequestInput) {
    try {
      await axios.post("/api/instructors/apply", { ...data, type: "female_request" });
      setSuccess(true);
    } catch {
      // silent — show generic error if needed
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-3xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-brand-black mb-2">Request Received!</h3>
        <p className="text-brand-muted">We&apos;ll match you with a female instructor and get back to you within 24 hours.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Your Name</label>
          <input
            {...register("name")}
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
            placeholder="Full name"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
            placeholder="07700 900000"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Postcode</label>
          <input
            {...register("postcode")}
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm uppercase"
            placeholder="SL1 2AB"
          />
          {errors.postcode && <p className="text-xs text-red-500 mt-1">{errors.postcode.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Preferred Day</label>
          <select
            {...register("preferredDay")}
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm bg-white"
          >
            <option value="">Select a day…</option>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.preferredDay && <p className="text-xs text-red-500 mt-1">{errors.preferredDay.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Preferred Time</label>
          <select
            {...register("preferredTime")}
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm bg-white"
          >
            <option value="">Select a time…</option>
            {["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–8pm)"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.preferredTime && <p className="text-xs text-red-500 mt-1">{errors.preferredTime.message}</p>}
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Request a Female Instructor"}
      </button>
    </form>
  );
}

export default function FemaleInstructorsPage() {
  return (
    <>
      <PageHero
        title="Learn to Drive"
        subtitle="Female driving instructors who put your comfort and confidence first."
        dark={false}
        eyebrow="Female Driving Instructors"
      />

      {/* Long-form SEO article */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <aside className="lg:sticky lg:top-24 self-start">
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-brand-black leading-tight"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Learning to drive with a female instructor
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
            <div className="space-y-4 mb-8">
              {articleIntro.map((p, i) => (
                <p key={i}>
                  {i === 0 ? (
                    <>
                      If you&apos;ve recently received your provisional driving licence, the next step is usually to
                      start thinking about{" "}
                      <Link href="/learn-to-drive" className="text-brand-red font-semibold hover:underline">
                        driving lessons
                      </Link>
                      .
                    </>
                  ) : (
                    p
                  )}
                </p>
              ))}
            </div>

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
                </div>
              </div>
            ))}

            <Link
              href="#request"
              className="inline-flex items-center gap-2 mt-3 px-6 py-3 bg-brand-red text-white rounded-full font-semibold hover:bg-brand-orange transition-colors"
            >
              Request a female instructor <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="py-16 bg-white px-4 border-y border-brand-border">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl font-bold text-brand-black text-center mb-2"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Lesson prices
          </h2>
          <p className="text-center text-sm text-brand-muted mb-10 max-w-lg mx-auto">
            Female instructors use the same published rates as all AutoPilot lessons — updated from admin in one place.
          </p>
          <div className="space-y-12">
            <PublicCategoryPricingCards lessonType="MANUAL" sectionTitle="Manual lessons" />
            <PublicCategoryPricingCards lessonType="AUTOMATIC" sectionTitle="Automatic lessons" />
          </div>
        </div>
      </section>

      {/* Instructor Cards */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Meet Our Female Instructors
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {instructors.map((inst, i) => (
              <motion.div
                key={inst.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    {inst.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-black text-lg">{inst.name}</h3>
                    <p className="text-sm text-brand-muted">{inst.yearsExp} years experience</p>
                    <StarRating rating={inst.rating} />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 flex-wrap">
                    {inst.areas.map((a) => (
                      <span key={a} className="bg-brand-surface text-brand-black px-2 py-0.5 rounded-md text-xs font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {inst.transmission.map((t) => (
                      <span key={t} className="bg-red-50 text-brand-red px-2 py-0.5 rounded-md text-xs font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/booking"
                  className="mt-4 block text-center px-6 py-2.5 bg-brand-red text-white rounded-full hover:bg-brand-orange transition-colors duration-200 text-sm font-semibold"
                >
                  Book with {inst.name.split(" ")[0]}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-brand-black px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-white">
                <Icon className="w-6 h-6 text-brand-orange" />
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section id="request" className="py-16 bg-white px-4 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Request a Female Instructor
            </h2>
            <p className="text-brand-muted">
              Fill in your details and we&apos;ll match you with the best available instructor in your area.
            </p>
          </div>
          <div className="bg-brand-surface rounded-2xl p-8 border border-brand-border">
            <RequestForm />
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
            Book an instructor online
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Check availability and book your first AutoPilot driving lesson today.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-8 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            Get Prices <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
