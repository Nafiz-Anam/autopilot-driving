"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Calendar, PoundSterling, Monitor, Headphones } from "lucide-react";
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
    title: "Part 1 — Theory Test",
    duration: "~3 months",
    description:
      "A computer-based test covering traffic signs, the Highway Code, and hazard perception. Minimum 85/100 to pass.",
  },
  {
    num: 2,
    title: "Part 2 — Driving Ability Test",
    duration: "~3 months",
    description:
      "An advanced driving test assessing your own driving to a high standard. Assessed by a DVSA examiner.",
  },
  {
    num: 3,
    title: "Part 3 — Instructional Ability Test",
    duration: "~3 months",
    description:
      "A 1-hour test where you demonstrate your ability to teach driving to a pupil. This is the final step to full ADI status.",
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
      "The full ADI qualification process typically takes 9–18 months depending on how quickly you progress through the 3 parts. Many people complete it in 9–12 months if they study consistently.",
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

      {/* Full UK Licence Toggle */}
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

      {/* Years Experience */}
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

      {/* ADI Training Toggle */}
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

      {/* Message */}
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
        title="Turn Your Driving Skills into a Career"
        subtitle="Earn up to £35,000/year on your own schedule"
        dark={false}
        eyebrow="Become an ADI"
      />

      {/* ADI Process */}
      <section className="py-16 lg:py-24 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              The ADI Qualification Process
            </h2>
            <p className="text-brand-muted">Three steps over approximately 9 months to become a fully qualified instructor.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {adiSteps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-red text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-brand-black mb-1">{step.title}</h3>
                <p className="text-xs font-semibold text-brand-orange mb-2">{step.duration}</p>
                <p className="text-sm text-brand-muted leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-brand-surface px-4">
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
                  className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm"
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

      {/* Application Form */}
      <section className="py-16 bg-white px-4">
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
          <div className="bg-brand-surface rounded-2xl p-8 border border-brand-border">
            <ApplicationForm />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-brand-surface px-4">
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
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm">
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
      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl font-bold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion className="border border-brand-border rounded-2xl overflow-hidden">
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
