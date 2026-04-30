"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  Calendar,
  PoundSterling,
  Monitor,
  Headphones,
  Award,
  CheckCircle2,
  ShieldCheck,
  Clock,
  GraduationCap,
  Phone,
} from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const adiSteps = [
  {
    num: 1,
    title: "Part 1 — Theory",
    duration: "~3 months",
    summary:
      "A computer-based test covering traffic signs, the Highway Code, and hazard perception. Minimum 85/100 to pass.",
    points: [
      "Learning made simple — 24/7 access to our AI-powered learning platform whenever it suits you.",
      "Join live interactive sessions with experienced trainers in our online classroom.",
      "Dive into our dedicated trainee forums for tips, peer support and discussions.",
      "Get exam-ready with mock tests, practice questions, and hazard perception support.",
    ],
  },
  {
    num: 2,
    title: "Part 2 — Driving Ability",
    duration: "~3 months",
    summary:
      "Master the art of driving with smart, guided learning — assessed by a DVSA examiner against the 27 skills required for the UK driving test.",
    points: [
      "AI-powered learning platform helps you understand all 27 skills the DVSA assess.",
      "Lesson planning tips and structure guidance for every topic — perfect for building confidence.",
      "Online classrooms covering hazard perception and the science behind safe driving.",
      "Hands-on practical training sessions woven through your six-day immersive course.",
    ],
  },
  {
    num: 3,
    title: "Part 3 — Instructional Ability",
    duration: "~3 months",
    summary:
      "A 1-hour test where you demonstrate your ability to teach driving to a pupil. The final step to full ADI status.",
    points: [
      "3 days of immersive learning plus 3 days of in-car coaching across two weeks.",
      "Peer learning opportunities — share ideas, practise together, learn from one another.",
      "Full support from our AI-powered platform, the AutoPilot team, and experienced trainers.",
      "Be ready to teach real learners with a driving school franchise on day one.",
    ],
  },
];

const benefits = [
  {
    icon: Calendar,
    title: "Flexible Hours",
    description: "Set your own working hours. Work mornings, evenings, or weekends — it's your business.",
  },
  {
    icon: PoundSterling,
    title: "Competitive Earnings",
    description: "Earn up to £35,000/year. Full-time instructors in our network average £28,000–£35,000.",
  },
  {
    icon: Monitor,
    title: "Booking System Provided",
    description: "Our online booking platform handles scheduling, reminders, and payments so you can focus on teaching.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "A dedicated support team to help you with admin, marketing, and any challenges you face.",
  },
];

const trainerFunctions = [
  "Ensuring safety at every stage of a lesson",
  "Communication in the car and traffic environment",
  "Supporting a student's learning",
  "Facilitating a student's driving practice",
  "Identifying and supporting opportunities for a student's development",
];

const pricingCards = [
  {
    icon: PoundSterling,
    title: "Just £1,549",
    description:
      "£1,549 for the full driving instructor training and no hidden charges. Pay upfront or in up to 11 instalments with a £399 deposit.",
    accent: "from-[#E8200A] to-[#FF5500]",
  },
  {
    icon: GraduationCap,
    title: "Extra Training",
    description:
      "Additional instructor training can be provided on request at a charge of £40 per hour with one of our senior trainers.",
    accent: "from-[#FF5500] to-[#FFA500]",
  },
  {
    icon: ShieldCheck,
    title: "Cancellation Policy",
    description:
      "There is a 14-day period post booking when you can cancel the course. Post this date the fee is non-refundable.",
    accent: "from-[#1F2937] to-[#4B5563]",
  },
];

const testimonials = [
  {
    name: "James Williams",
    quote:
      "Joining AutoPilot was the best career decision I made. The support team is brilliant and I have a full diary within 3 months of qualifying.",
    role: "Instructor since 2021",
  },
  {
    name: "David Patel",
    quote:
      "I was a teacher before becoming an ADI. The transition was smooth and earning more than I ever did in school, while working hours that suit my family.",
    role: "Instructor since 2022",
  },
  {
    name: "Michael O'Brien",
    quote:
      "The booking platform is a game-changer. I never have to chase payments or deal with no-shows — it's all handled.",
    role: "Instructor since 2020",
  },
];

const faqs = [
  {
    value: "q1",
    question: "How long does ADI training take?",
    answer:
      "With our immersive course you can complete Part 1 & Part 2 within 26 weeks. The full ADI qualification typically takes 9–12 months end-to-end if you study consistently.",
  },
  {
    value: "q2",
    question: "Do I need to have a car to become an instructor?",
    answer:
      "You will need a suitable car for teaching — usually an affordable, small hatchback with dual controls installed. We can help connect you with car lease schemes designed for ADIs.",
  },
  {
    value: "q3",
    question: "Can I work part-time as an instructor?",
    answer:
      "Absolutely. Many of our instructors work part-time while running other businesses or alongside employment. You set your own hours.",
  },
  {
    value: "q4",
    question: "What support does AutoPilot provide?",
    answer:
      "We provide a full online booking platform, marketing support, student referrals in your area, ongoing CPD support, and a dedicated support line for any issues.",
  },
  {
    value: "q5",
    question: "Do I need to have started ADI training to apply?",
    answer:
      "No — we welcome applications from those who are thinking about becoming an instructor. We can guide you on the best training providers and what to expect.",
  },
  {
    value: "q6",
    question: "How much can I realistically earn?",
    answer:
      "Full-time instructors in our network typically earn £28,000–£35,000 per year. Part-time instructors earn between £800–£1,500/month depending on hours worked.",
  },
];

const applicationSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^(\+44|0)7\d{9}$/, "Enter a valid UK mobile number"),
  postcode: z.string().min(3, "Postcode required"),
  hasFullLicence: z.boolean(),
  yearsExperience: z.enum(["3-5", "6-10", "10+"], { errorMap: () => ({ message: "Please select experience" }) }),
  trainingStarted: z.boolean(),
  message: z.string().optional(),
});

type ApplicationInput = z.infer<typeof applicationSchema>;

function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [hasLicence, setHasLicence] = useState<boolean | null>(null);
  const [trainingStarted, setTrainingStarted] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { hasFullLicence: false, trainingStarted: false },
  });

  async function onSubmit(data: ApplicationInput) {
    try {
      await axios.post("/api/instructors/apply", data);
      setSubmitted(true);
    } catch {
      // handle error
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-3xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-brand-black mb-2">Application Received!</h3>
        <p className="text-brand-muted">We&apos;ll review your application and contact you within 48 hours.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-black mb-1">Full Name</label>
          <input
            {...register("fullName")}
            className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm"
            placeholder="Your full name"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
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
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Do you hold a full UK driving licence?
        </label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => {
                setHasLicence(val);
                setValue("hasFullLicence", val);
              }}
              className={cn(
                "flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold transition-colors duration-200",
                hasLicence === val
                  ? "border-brand-red bg-red-50 text-brand-red"
                  : "border-brand-border text-brand-muted hover:border-brand-red"
              )}
            >
              {val ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-black mb-1">Years of driving experience</label>
        <select
          {...register("yearsExperience")}
          className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm bg-white"
        >
          <option value="">Select…</option>
          <option value="3-5">3–5 years</option>
          <option value="6-10">6–10 years</option>
          <option value="10+">10+ years</option>
        </select>
        {errors.yearsExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsExperience.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-black mb-2">
          Have you already started ADI training?
        </label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => {
                setTrainingStarted(val);
                setValue("trainingStarted", val);
              }}
              className={cn(
                "flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold transition-colors duration-200",
                trainingStarted === val
                  ? "border-brand-red bg-red-50 text-brand-red"
                  : "border-brand-border text-brand-muted hover:border-brand-red"
              )}
            >
              {val ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-black mb-1">Additional message (optional)</label>
        <textarea
          {...register("message")}
          rows={3}
          className="w-full px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red text-sm resize-none"
          placeholder="Tell us a bit about yourself…"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

export default function BecomeInstructorPage() {
  return (
    <>
      <PageHero
        title="Train for £1,549"
        subtitle="Driving Instructor Training Course — earn up to £35,000/year on your own schedule"
        dark={false}
        eyebrow="Become an ADI"
      />

      {/* Course Intro + Award */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg sm:text-xl text-brand-black font-semibold leading-relaxed mb-3">
            Our AutoPilot training course combines immersive classroom learning with practical driving lessons.
          </p>
          <p className="text-brand-muted leading-relaxed mb-10">
            Cutting-edge driver training — with AutoPilot you can complete your Part 1 &amp; Part 2 within 26 weeks*.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 bg-brand-surface border border-brand-border rounded-2xl px-6 py-4"
          >
            <div className="w-14 h-14 rounded-full bg-brand-red text-white flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-brand-muted">Intelligent Instructor Awards 2024</p>
              <p className="font-extrabold text-brand-black">Winner — Product of the Year</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3-Part Course Detail */}
      <section className="py-16 lg:py-24 bg-brand-surface px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              AutoPilot Training Course
            </h2>
            <p className="text-brand-muted">Delivered in 3 parts to match the DVSA qualification.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adiSteps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-red text-white rounded-full flex items-center justify-center text-xl font-extrabold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-black leading-tight">{step.title}</h3>
                    <p className="text-xs font-semibold text-brand-orange">{step.duration}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed mb-4">{step.summary}</p>
                <ul className="space-y-2.5 mt-auto">
                  {step.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-brand-black/80 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What will the training give you */}
      <section className="py-16 lg:py-20 bg-white px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden bg-gradient-to-br from-brand-red to-brand-orange aspect-[4/3] flex items-center justify-center"
          >
            <div className="text-center text-white p-8">
              <Monitor className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <p className="text-2xl font-extrabold">Immersive Training</p>
              <p className="text-sm opacity-90 mt-2">Real driving scenarios in a safe classroom environment</p>
            </div>
          </motion.div>
          <div>
            <h2
              className="text-3xl font-bold text-brand-black mb-4"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              What will the integrated training give you?
            </h2>
            <p className="text-brand-muted leading-relaxed mb-6">
              Immersive in-car training brought to you in a classroom environment, supported by an AutoPilot qualified
              driving instructor trainer. The five key functions of a good driving instructor:
            </p>
            <ol className="space-y-3">
              {trainerFunctions.map((f, i) => (
                <li key={f} className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-brand-red text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-brand-black/85 leading-relaxed pt-0.5">{f}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Pricing / Policy Cards */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br",
                    c.accent
                  )}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-extrabold text-brand-black text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{c.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Why Join AutoPilot?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-brand-surface rounded-2xl p-6 border border-brand-border"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2">{b.title}</h3>
                  <p className="text-sm text-brand-muted">{b.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 py-12">
        <div
          className="max-w-6xl mx-auto rounded-3xl px-6 py-10 sm:py-12 text-center text-white"
          style={{ background: "linear-gradient(120deg, #E8200A 0%, #FF5500 100%)" }}
        >
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Interested in becoming a Driving Instructor?
          </h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
            Call our team on <span className="font-bold">0330 100 7509</span> or send us a message to find out more.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 bg-white text-brand-red px-7 py-3 rounded-full font-bold hover:bg-brand-surface transition-colors"
          >
            <Phone className="w-4 h-4" />
            Get in Touch
          </a>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-16 bg-brand-surface px-4 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Apply to Join
            </h2>
            <p className="text-brand-muted">Fill in your details and we&apos;ll be in touch within 48 hours.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm">
            <ApplicationForm />
          </div>
          <p className="text-xs text-brand-muted text-center mt-6">
            *Based on trainee engagement in training materials and DVSA test availability.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Hear from Our Instructors
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
                <p className="text-brand-muted text-sm italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-brand-black text-sm">{t.name}</p>
                  <p className="text-xs text-brand-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-brand-surface px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Clock className="w-10 h-10 text-brand-red mx-auto mb-3" />
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion className="border border-brand-border rounded-2xl overflow-hidden bg-white">
            {faqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value} className="border-brand-border">
                <AccordionTrigger className="px-6 font-semibold text-brand-black text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-brand-muted text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
