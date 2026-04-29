"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Clock, CalendarDays, CheckCircle2, MapPin, CreditCard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Phone screen UI ──────────────────────────────────────────────────────────

function Screen1() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-4 pb-4 border-b border-gray-100">
        <p className="text-[11px] text-gray-400 mb-2 font-medium">Your postcode</p>
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
          <MapPin className="w-4 h-4 text-brand-red shrink-0" />
          <span className="text-sm font-semibold text-gray-700">SL1 1AA, Slough</span>
        </div>
      </div>
      <div className="px-5 pt-4 flex-1 overflow-hidden">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">3 instructors nearby</p>
        {[
          { initials: "JW", name: "James Williams", exp: "8 yrs", rating: 4.9, price: "£42/hr", tag: "Manual & Auto", color: "bg-brand-red" },
          { initials: "SA", name: "Sarah Ahmed",    exp: "5 yrs", rating: 4.8, price: "£42/hr", tag: "Automatic",    color: "bg-violet-500" },
          { initials: "DP", name: "David Patel",    exp: "12 yrs",rating: 4.7, price: "£40/hr", tag: "Manual",       color: "bg-sky-500" },
        ].map((inst, i) => (
          <motion.div
            key={inst.initials}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.08, duration: 0.25 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl mb-2.5 border transition-all",
              i === 0 ? "border-red-200 bg-red-50/70 shadow-sm" : "border-gray-100 bg-white"
            )}
          >
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0", inst.color)}>
              {inst.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-800 truncate">{inst.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400">{inst.exp}</span>
                <span className="text-gray-200">·</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-semibold text-gray-600">{inst.rating}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-extrabold text-brand-red">{inst.price}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{inst.tag}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Screen2() {
  const days = [
    { day: "Mon", date: "27", active: false },
    { day: "Tue", date: "28", active: false },
    { day: "Wed", date: "29", active: true },
    { day: "Thu", date: "30", active: false },
    { day: "Fri", date: "1",  active: false },
  ];
  const slots = [
    { time: "9:00am",  selected: false },
    { time: "11:00am", selected: false },
    { time: "1:00pm",  selected: true  },
    { time: "3:00pm",  selected: false },
    { time: "5:00pm",  selected: false },
  ];
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-4 pb-4 border-b border-gray-100">
        <p className="text-[12px] font-bold text-gray-700 mb-3">Choose a date</p>
        <div className="flex gap-2">
          {days.map((d) => (
            <div
              key={d.date}
              className={cn(
                "flex-1 flex flex-col items-center py-2 rounded-2xl text-center border transition-all",
                d.active ? "bg-brand-red border-brand-red text-white shadow-md shadow-red-200" : "border-gray-100 bg-gray-50 text-gray-500"
              )}
            >
              <span className="text-[9px] font-medium">{d.day}</span>
              <span className="text-[13px] font-bold leading-tight mt-0.5">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 pt-4 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Available slots</p>
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.06, duration: 0.2 }}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-[12px] font-medium transition-all",
                slot.selected
                  ? "border-brand-red bg-brand-red text-white shadow-md shadow-red-200"
                  : "border-gray-100 text-gray-600 bg-white"
              )}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {slot.time}
              {slot.selected && (
                <span className="ml-auto text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">✓</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Screen3() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-4 pb-4 border-b border-gray-100">
        <p className="text-[12px] font-bold text-gray-700">Order summary</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Wed 29 April · 1:00pm</p>
      </div>
      <div className="px-5 pt-4 flex-1">
        <div className="space-y-0 mb-4">
          {[
            { label: "Instructor",  value: "James Williams" },
            { label: "Lesson",      value: "Manual · 1 hour" },
            { label: "Location",    value: "SL1 1AA, Slough" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <span className="text-[11px] text-gray-400">{row.label}</span>
              <span className="text-[11px] font-semibold text-gray-700">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3">
            <span className="text-[13px] font-bold text-gray-800">Total</span>
            <span className="text-[16px] font-extrabold text-brand-red">£42.00</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-100 mb-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-700">•••• •••• •••• 4242</p>
            <p className="text-[9px] text-gray-400">Visa · Expires 12/27</p>
          </div>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="w-full bg-brand-red text-white text-[13px] font-bold py-3 rounded-2xl shadow-lg shadow-red-200"
        >
          Confirm &amp; Pay
        </motion.button>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-1.5 mt-2"
        >
          <Shield className="w-3 h-3 text-gray-400" />
          <span className="text-[9px] text-gray-400">Secured by Stripe</span>
        </motion.div>
      </div>
    </div>
  );
}

function Screen4() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-5">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.05 }}
        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-lg shadow-green-100"
      >
        <CheckCircle2 className="w-9 h-9 text-green-500" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="text-[16px] font-extrabold text-gray-800 text-center"
      >
        Lesson Booked! 🎉
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[11px] text-gray-400 text-center mt-1"
      >
        Wed 29 April at 1:00pm
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.2 }}
        className="w-full mt-5 bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3"
      >
        {[
          { icon: <CalendarDays className="w-3.5 h-3.5 text-brand-red" />, text: "Wed 29 Apr · 1:00pm · 1 hr" },
          { icon: <div className="w-3.5 h-3.5 rounded-full bg-brand-red flex items-center justify-center text-white text-[7px] font-bold">JW</div>, text: "James Williams · Manual" },
          { icon: <MapPin className="w-3.5 h-3.5 text-brand-red" />, text: "SL1 1AA, Slough" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {row.icon}
            <span className="text-[11px] text-gray-600 font-medium">{row.text}</span>
          </div>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[10px] text-gray-400 mt-3 text-center"
      >
        Confirmation sent to your email
      </motion.p>
    </div>
  );
}

// ── Slide data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    screen: <Screen1 />,
    step: "Step 01",
    heading: "Find your perfect instructor",
    body: "Enter your postcode and instantly see DVSA-approved instructors near you — filtered by transmission type, rating, and availability.",
    accent: "from-red-500 to-orange-400",
  },
  {
    screen: <Screen2 />,
    step: "Step 02",
    heading: "Pick a time that suits you",
    body: "Browse your instructor's live calendar and select a slot that fits your schedule. No phone calls, no waiting — just instant availability.",
    accent: "from-violet-500 to-purple-400",
  },
  {
    screen: <Screen3 />,
    step: "Step 03",
    heading: "Book and pay in seconds",
    body: "Review your lesson details and pay securely online via Stripe. Everything confirmed instantly with a receipt sent to your inbox.",
    accent: "from-sky-500 to-blue-400",
  },
  {
    screen: <Screen4 />,
    step: "Step 04",
    heading: "You're ready to go",
    body: "Your lesson is locked in. Manage bookings from your dashboard, add it to your calendar, and get ready to hit the road.",
    accent: "from-green-500 to-emerald-400",
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export function AppFlowSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((next: number) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  }, [current]);

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => go((current + 1) % SLIDES.length);

  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const phoneVariants = {
    enter:  (dir: number) => ({ opacity: 0, y: dir > 0 ? 30 : -30, scale: 0.96 }),
    center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" as const } },
    exit:   (dir: number) => ({ opacity: 0, y: dir > 0 ? -30 : 30, scale: 0.96, transition: { duration: 0.18 } }),
  };

  const textVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
    exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24, transition: { duration: 0.15 } }),
  };

  const slide = SLIDES[current];

  return (
    <section className="relative bg-brand-black py-24 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      {/* Animated glow blob */}
      <motion.div
        key={current}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn("absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-gradient-to-br pointer-events-none", slide.accent)}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-3">How it works</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Booking a lesson has<br className="hidden md:block" /> never been easier
          </h2>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          {/* Prev arrow */}
          <button
            onClick={prev}
            aria-label="Previous"
            className="shrink-0 w-11 h-11 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Content grid */}
          <div className="flex-1 grid md:grid-cols-2 gap-10 md:gap-20 items-center">

            {/* Phone */}
            <div className="flex justify-center order-1">
              <div className="relative">
                {/* Glow under phone */}
                <motion.div
                  key={current}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={cn("absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 blur-2xl rounded-full bg-gradient-to-r opacity-50 pointer-events-none", slide.accent)}
                />

                {/* Phone shell */}
                <div className="relative bg-[#1a1a1a] rounded-[44px] p-3 shadow-2xl border border-white/10"
                  style={{ width: 290 }}
                >
                  {/* Dynamic Island */}
                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-full z-20 border border-white/5" />

                  {/* Screen */}
                  <div className="bg-white rounded-[34px] overflow-hidden" style={{ height: 580 }}>
                    {/* Status bar */}
                    <div className="px-5 pt-8 pb-2 flex items-center justify-between bg-white">
                      <span className="text-[11px] font-bold text-gray-800">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                          <rect x="0" y="3" width="3" height="9" rx="1" fill="#1c1c1e" />
                          <rect x="4.5" y="2" width="3" height="10" rx="1" fill="#1c1c1e" />
                          <rect x="9" y="0" width="3" height="12" rx="1" fill="#1c1c1e" />
                          <rect x="14" y="1" width="2.5" height="10" rx="1" fill="#1c1c1e" opacity="0.3" />
                        </svg>
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                          <rect x="0.5" y="0.5" width="13" height="11" rx="3.5" stroke="#1c1c1e" />
                          <rect x="14.5" y="3.5" width="1" height="5" rx="0.5" fill="#1c1c1e" opacity="0.4" />
                          <rect x="2" y="2" width="9" height="8" rx="2" fill="#34c759" />
                        </svg>
                      </div>
                    </div>

                    {/* App content */}
                    <div style={{ height: 518 }}>
                      <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                          key={current}
                          custom={direction}
                          variants={phoneVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          className="h-full"
                        >
                          {slide.screen}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pt-2.5 pb-0.5">
                    <div className="w-28 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-2">
              {/* Progress dots */}
              <div className="flex gap-2.5 mb-8">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === current ? "w-10 bg-brand-red" : "w-4 bg-white/20 hover:bg-white/40"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <p className={cn("text-sm font-extrabold uppercase tracking-widest mb-3 bg-gradient-to-r bg-clip-text text-transparent", slide.accent)}>
                    {slide.step}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-5">
                    {slide.heading}
                  </h3>
                  <p className="text-white/55 leading-relaxed text-base md:text-lg">
                    {slide.body}
                  </p>

                  {/* Step counter */}
                  <div className="mt-10 flex items-center gap-3">
                    <span className="text-4xl font-black text-white/10 leading-none select-none">
                      0{current + 1}
                    </span>
                    <span className="text-white/20 text-sm">/ 0{SLIDES.length}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            aria-label="Next"
            className="shrink-0 w-11 h-11 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
