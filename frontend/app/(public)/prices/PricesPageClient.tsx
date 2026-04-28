"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Star,
  MessageCircle,
  Zap,
  MapPin,
  CheckCircle,
  Phone,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Data ─────────────────────────────────────────────── */

const manualLessons = [
  { label: "1 Hour", pricePerHour: 42, total: 42, note: "Pay per lesson" },
  {
    label: "5 Hours",
    pricePerHour: 39,
    total: 195,
    note: "£195 block booked",
    savings: 15,
    popular: true,
  },
  {
    label: "10 Hours",
    pricePerHour: 38,
    total: 380,
    note: "£380 block booked",
    savings: 40,
  },
];

const automaticLessons = [
  { label: "1 Hour", pricePerHour: 44, total: 44, note: "Pay per lesson" },
  {
    label: "5 Hours",
    pricePerHour: 41,
    total: 205,
    note: "£205 block booked",
    savings: 15,
  },
  {
    label: "10 Hours",
    pricePerHour: 40,
    total: 400,
    note: "£400 block booked",
    savings: 40,
  },
];

const intensivePackages = [
  { hours: 10, price: 380, desc: "Ideal for experienced drivers", highlight: false },
  { hours: 20, price: 720, desc: "Ideal for intermediate drivers", highlight: true },
  { hours: 30, price: 1050, desc: "Ideal for beginner drivers", highlight: false },
  { hours: 40, price: 1380, desc: "Ideal for beginner drivers", highlight: false },
  { hours: 50, price: 1700, desc: "Ideal for new drivers", highlight: false },
  {
    hours: 0,
    label: "Retest Course",
    price: 180,
    desc: "For experienced drivers wanting to pass fast",
    highlight: false,
  },
];

const testCentres = [
  { name: "Goodmayes", fee: 175 },
  { name: "Barking", fee: 175 },
  { name: "Hornchurch", fee: 175 },
  { name: "Wanstead", fee: 175 },
  { name: "Chingford", fee: 175 },
  { name: "Sidcup", fee: 175 },
  { name: "Hither Green", fee: 175 },
  { name: "South Norwood", fee: 175 },
  { name: "Romford", fee: 175 },
];

const otherLessons = [
  { name: "Manual Refresher", price: 42, unit: "per lesson" },
  { name: "Automatic Refresher", price: 44, unit: "per lesson" },
  { name: "Pass Plus Course", price: 260, unit: "8 modules" },
];

const trustBadges = [
  { icon: Star, label: "4.9/5 Rating" },
  { icon: MessageCircle, label: "40+ Reviews" },
  { icon: Zap, label: "Flexible Learning" },
  { icon: MapPin, label: "Near You" },
];

const usps = [
  {
    title: "One-to-one tuition",
    body: "Driving lessons 7 days a week, built around your schedule. Every hour is dedicated quality time with your designated instructor — no distractions, no group sessions.",
  },
  {
    title: "Finest quality lessons",
    body: "Affordable doesn't mean cheap. We offer the same standard of tuition at prices that respect your budget. Every instructor is DVSA-approved and fully insured.",
  },
  {
    title: "Personalised lessons",
    body: "Available in blocks of 5, 10, 20, 30 or 40 lessons. We tailor the pace and content to your ability so you're never wasting time or money.",
  },
];

/* ─── Helpers ───────────────────────────────────────────── */

const HEADING = { fontFamily: "'Moderniz','Barlow',sans-serif" };

function SectionTitle({
  children,
  sub,
  light,
}: {
  children: ReactNode;
  sub?: string;
  light?: boolean;
}) {
  return (
    <div className="text-center mb-10">
      <h2
        className={cn(
          "text-3xl lg:text-4xl font-bold mb-3",
          light ? "text-white" : "text-brand-black"
        )}
        style={HEADING}
      >
        {children}
      </h2>
      {sub && (
        <p className={cn("max-w-xl mx-auto", light ? "text-white/70" : "text-brand-muted")}>
          {sub}
        </p>
      )}
    </div>
  );
}

function LessonCard({
  label,
  pricePerHour,
  note,
  savings,
  popular,
  delay = 0,
  dark = false,
}: {
  label: string;
  pricePerHour: number;
  note: string;
  savings?: number;
  popular?: boolean;
  delay?: number;
  dark?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative rounded-2xl p-6 flex flex-col",
        popular
          ? "border-2 border-brand-red shadow-lg shadow-red-100 scale-[1.03]"
          : dark
          ? "bg-brand-dark-surface border border-white/10"
          : "bg-white border border-brand-border shadow-sm"
      )}
    >
      {popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
          Most Popular
        </span>
      )}
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-widest mb-1",
          dark ? "text-brand-orange" : "text-brand-red"
        )}
      >
        {label}
      </p>
      <div className="flex items-end gap-2 mb-1">
        <span
          className={cn("text-5xl font-extrabold", dark ? "text-white" : "text-brand-black")}
          style={HEADING}
        >
          £{pricePerHour}
        </span>
        <span className={cn("text-sm mb-2", dark ? "text-white/50" : "text-brand-muted")}>
          / hour
        </span>
      </div>
      {savings && (
        <span className="inline-block mb-2 text-xs font-bold text-brand-orange bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full w-fit">
          Save £{savings}
        </span>
      )}
      <p className={cn("text-sm mt-auto pt-2", dark ? "text-white/50" : "text-brand-muted")}>
        {note}
      </p>
    </motion.div>
  );
}

/* ─── Sections ──────────────────────────────────────────── */

function CallbackForm() {
  const [enquiry, setEnquiry] = useState("");
  const [callTime, setCallTime] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-2xl p-8 shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
          <Phone className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-brand-black">We can call you</span>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Name"
          className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
        <input
          type="tel"
          placeholder="Phone number"
          className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-red transition-colors"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={enquiry} onValueChange={(v) => setEnquiry(v ?? "")}>
            <SelectTrigger className="w-full h-[46px] rounded-xl border border-brand-border px-4 text-sm data-placeholder:text-brand-muted">
              <SelectValue placeholder="Enquiring about?" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" sideOffset={6}>
              <SelectItem value="manual">Manual lessons</SelectItem>
              <SelectItem value="automatic">Automatic lessons</SelectItem>
              <SelectItem value="intensive">Intensive course</SelectItem>
              <SelectItem value="pass-plus">Pass Plus</SelectItem>
            </SelectContent>
          </Select>
          <Select value={callTime} onValueChange={(v) => setCallTime(v ?? "")}>
            <SelectTrigger className="w-full h-[46px] rounded-xl border border-brand-border px-4 text-sm data-placeholder:text-brand-muted">
              <SelectValue placeholder="Best time to call?" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" sideOffset={6}>
              <SelectItem value="morning">Morning (9–12)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12–5)</SelectItem>
              <SelectItem value="evening">Evening (5–8)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button className="w-full bg-brand-red hover:bg-brand-orange text-white font-bold py-3 rounded-xl transition-colors duration-200">
          Request callback →
        </button>
      </div>
    </motion.div>
  );
}

function HeroSection() {
  return (
    <section className="bg-brand-black pt-20 pb-0 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center pb-16">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-brand-orange text-sm font-semibold uppercase tracking-widest mb-4">
            Transparent Pricing
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
            style={HEADING}
          >
            Driving Lesson{" "}
            <span className="text-brand-red">Prices</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-md">
            No hidden costs. No nasty surprises. Just straightforward pricing from a driving
            school you can trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
            >
              Book a Lesson
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-full font-semibold hover:border-white/50 transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </Link>
          </div>
        </motion.div>

        <CallbackForm />
      </div>

      {/* Trust badges strip */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.07 }}
              className={cn(
                "flex items-center justify-center gap-2 py-4 text-sm font-semibold text-white/80",
                i !== trustBadges.length - 1 && "border-r border-white/10"
              )}
            >
              <badge.icon className="w-4 h-4 text-brand-orange" />
              {badge.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlertBanner() {
  return (
    <div className="bg-red-50 border-b border-brand-red/20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-brand-red font-medium">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Remember to review Terms &amp; Conditions before taking lessons
      </div>
    </div>
  );
}

function LessonTypeSection({
  title,
  lessons,
  bg = "white",
}: {
  title: string;
  lessons: typeof manualLessons;
  bg?: "white" | "surface";
}) {
  return (
    <section
      className={cn(
        "py-16 lg:py-20 px-4",
        bg === "surface" ? "bg-brand-surface" : "bg-white"
      )}
    >
      <div className="max-w-4xl mx-auto">
        <SectionTitle>{title}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {lessons.map((l, i) => (
            <LessonCard key={l.label} {...l} delay={i * 0.08} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
          >
            Book Now
          </Link>
        </div>
      </div>
    </section>
  );
}

function IntensiveSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 px-4 bg-brand-black">
      <div className="max-w-6xl mx-auto">
        <SectionTitle sub="Commit to a course and pass faster." light>
          Intensive Lesson Packages
        </SectionTitle>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {intensivePackages.map((pkg, i) => (
            <motion.div
              key={pkg.label ?? `${pkg.hours}hr`}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={cn(
                "relative rounded-2xl p-6 flex flex-col gap-2",
                pkg.highlight
                  ? "border-2 border-brand-red bg-brand-dark-surface shadow-lg shadow-red-950/40 scale-[1.02]"
                  : "bg-brand-dark-surface border border-white/10"
              )}
            >
              {pkg.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-red text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                  Best Value
                </span>
              )}
              <p className="text-brand-orange text-xs font-bold uppercase tracking-widest">
                {pkg.label ?? `${pkg.hours} Hours`}
              </p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-extrabold text-white" style={HEADING}>
                  £{pkg.price.toLocaleString()}
                </span>
              </div>
              <p className="text-white/50 text-sm">{pkg.desc}</p>
              <Link
                href="/booking"
                className="mt-4 block text-center py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-brand-red hover:bg-brand-red/10 transition-colors duration-200"
              >
                Book Package
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestDayFeesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <SectionTitle sub="Know what to expect before you sit your test.">
          Test Day Fees
        </SectionTitle>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="bg-brand-surface rounded-2xl p-8"
        >
          <p className="text-brand-muted mb-6 leading-relaxed">
            As a driving learner, you'll have a good idea of when you're ready to take your
            practical driving test. When it comes to booking your driving test, you'll need to
            hire the car which you've been conducting your driving lessons with. This is so
            you're comfortable during your test as well as possible scenarios like{" "}
            <em>"Show me, Tell me"</em> questions which require physical handling of the car.
          </p>
          <p className="text-brand-black font-semibold mb-4">
            Test fees for different driving test centres:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {testCentres.map((tc, i) => (
              <motion.div
                key={tc.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-brand-border"
              >
                <span className="text-sm font-medium text-brand-black">{tc.name}</span>
                <span className="text-sm font-bold text-brand-red">£{tc.fee}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function OtherLessonsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-20 px-4 bg-brand-surface">
      <div className="max-w-4xl mx-auto">
        <SectionTitle>Other Available Lessons</SectionTitle>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {otherLessons.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.09 }}
              className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm flex flex-col gap-2"
            >
              <p className="text-sm font-semibold text-brand-black">{l.name}</p>
              <div>
                <span className="text-4xl font-extrabold text-brand-black" style={HEADING}>
                  £{l.price}
                </span>
              </div>
              <p className="text-xs text-brand-muted uppercase tracking-wide">{l.unit}</p>
              <Link
                href="/booking"
                className="mt-3 block text-center py-2 bg-brand-black text-white text-sm font-semibold rounded-xl hover:bg-brand-red transition-colors duration-200"
              >
                Book
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionTitle sub="Built around you, not around us.">
          At Our Driving School
        </SectionTitle>
        <motion.p
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-brand-muted text-center max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          We cater for all types of driving tuition, providing a range of carefully structured
          lessons dealing with every level of learning — from complete beginners to the Pass Plus
          scheme.
        </motion.p>
        <div className="grid sm:grid-cols-3 gap-8">
          {usps.map((usp, i) => (
            <motion.div
              key={usp.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              className="flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand-red" />
              </div>
              <h3 className="font-bold text-brand-black" style={HEADING}>
                {usp.title}
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">{usp.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlockBookingBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-20 px-4 bg-brand-black">
      <div className="max-w-4xl mx-auto">
        <SectionTitle light sub="Book in bulk — save per lesson.">
          Reduce with Block Bookings
        </SectionTitle>
        <div ref={ref} className="grid sm:grid-cols-3 gap-6">
          {/* Manual card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0 }}
            className="bg-brand-dark-surface border border-white/10 rounded-2xl p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
              Manual Lessons
            </p>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-4xl font-extrabold text-white" style={HEADING}>
                £38
              </span>
              <span className="text-sm text-white/40 mb-1">/ hour</span>
            </div>
            <ul className="space-y-1.5 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                Full driving hour
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                All top-up lessons
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                Learning materials
              </li>
            </ul>
          </motion.div>

          {/* Automatic card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="bg-brand-dark-surface border border-white/10 rounded-2xl p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
              Automatic Lessons
            </p>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-4xl font-extrabold text-white" style={HEADING}>
                £40
              </span>
              <span className="text-sm text-white/40 mb-1">/ hour</span>
            </div>
            <ul className="space-y-1.5 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                Full driving hour
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                All top-up lessons
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                Learning materials
              </li>
            </ul>
          </motion.div>

          {/* Savings highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: "var(--gradient-brand)" }}
          >
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">
              Reduce with Block Bookings
            </p>
            <div className="text-6xl font-extrabold text-white mb-1" style={HEADING}>
              £2
            </div>
            <p className="text-white/80 text-sm">off per hour</p>
            <Link
              href="/booking"
              className="mt-5 inline-block px-6 py-2.5 bg-white text-brand-red rounded-full font-bold text-sm hover:bg-gray-100 transition-colors duration-200"
            >
              See all prices
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-16 lg:py-24 px-4 bg-brand-surface">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto rounded-2xl overflow-hidden bg-brand-dark-surface"
      >
        <div className="p-10 text-center">
          <p className="text-brand-orange text-sm font-bold uppercase tracking-widest mb-3">
            Need to get in touch?
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3" style={HEADING}>
            Not sure which package?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            If you'd like to discuss which package best suits your needs, let us know — we can
            call you back.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              Request a Callback
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-white/20 text-white rounded-full font-semibold hover:border-white/50 transition-colors duration-200"
            >
              Book Directly
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function PricesPageClient() {
  return (
    <>
      <HeroSection />
      <AlertBanner />
      <LessonTypeSection title="Manual Driving Lessons" lessons={manualLessons} bg="white" />
      <LessonTypeSection
        title="Automatic Driving Lessons"
        lessons={automaticLessons}
        bg="surface"
      />
      <IntensiveSection />
      <TestDayFeesSection />
      <OtherLessonsSection />
      <AboutSection />
      <BlockBookingBanner />
      <ContactCTA />
    </>
  );
}
