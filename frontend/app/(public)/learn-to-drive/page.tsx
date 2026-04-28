"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Car, Zap, RefreshCw, User, Award, BookOpen } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const services = [
  {
    icon: Car,
    name: "Automatic & Manual",
    description: "Choose the transmission that suits your lifestyle and budget.",
    href: "/learn-to-drive/automatic-manual",
  },
  {
    icon: Zap,
    name: "Intensive Courses",
    description: "Pass your test in as little as 1–2 weeks with daily lessons.",
    href: "/learn-to-drive/intensive-courses",
  },
  {
    icon: RefreshCw,
    name: "Refresher Lessons",
    description: "Been off the road? Get your confidence back quickly.",
    href: "/learn-to-drive/refresher-lessons",
  },
  {
    icon: User,
    name: "Female Instructors",
    description: "Learn in a relaxed, supportive environment with a female instructor.",
    href: "/learn-to-drive/female-instructors",
  },
  {
    icon: Award,
    name: "Pass Plus",
    description: "Advanced training after you pass — and save on insurance too.",
    href: "/learn-to-drive/pass-plus",
  },
  {
    icon: BookOpen,
    name: "Theory Training",
    description: "Interactive theory practice with mock tests and hazard perception.",
    href: "/learn-to-drive/theory-training",
  },
];

function ServiceCard({
  service,
  index,
  inView,
}: {
  service: (typeof services)[0];
  index: number;
  inView: boolean;
}) {
  const Icon = service.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: "0 16px 40px -8px rgba(232,32,10,0.25)" }}
      className="bg-white border border-brand-border rounded-2xl p-6 flex flex-col group cursor-pointer"
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3
        className="text-xl font-bold text-brand-black mb-2"
        style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
      >
        {service.name}
      </h3>
      <p className="text-brand-muted text-sm flex-1 leading-relaxed">{service.description}</p>
      <Link
        href={service.href}
        className="mt-5 text-sm font-semibold text-brand-red group-hover:text-brand-orange transition-colors duration-200"
      >
        Learn More →
      </Link>
    </motion.div>
  );
}

export default function LearnToDrivePage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <>
      <PageHero
        title="Learn to Drive"
        subtitle="Expert DVSA-approved instruction across Slough, Windsor, Reading and beyond."
        dark={true}
        eyebrow="AutoPilot Driving School"
      />

      <section className="py-16 lg:py-24 bg-brand-surface px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold text-brand-black mb-3"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Everything You Need to Pass
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              From your first lesson to passing your test and beyond — we have a programme for every driver.
            </p>
          </div>
          <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <ServiceCard key={service.href} service={service} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-black py-16 px-4 text-center text-white">
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Ready to Get Started?
        </h2>
        <p className="text-brand-muted mb-8">Book your first lesson today — no commitment needed.</p>
        <Link
          href="/booking"
          className="inline-block px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
        >
          Book Your First Lesson
        </Link>
      </section>
    </>
  );
}
