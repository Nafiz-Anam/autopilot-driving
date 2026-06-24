"use client";

import { Phone, Mail, Clock } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { CallbackForm } from "@/components/shared/CallbackForm";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const openingHours = [
  { day: "Monday", hours: "9:00am – 7:00pm" },
  { day: "Tuesday", hours: "9:00am – 7:00pm" },
  { day: "Wednesday", hours: "9:00am – 7:00pm" },
  { day: "Thursday", hours: "9:00am – 7:00pm" },
  { day: "Friday", hours: "9:00am – 7:00pm" },
  { day: "Saturday", hours: "10:00am – 4:00pm" },
  { day: "Sunday", hours: "Closed" },
];

export default function ContactPageClient() {
  return (
    <>
      <PageHero
        title="Get in Touch"
        subtitle="We're here to help. Call, email, or fill in the form and we'll get back to you fast."
        dark={true}
      />

      <section className="py-16 lg:py-24 bg-brand-surface px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-brand-black mb-6"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              Contact Details
            </h2>

            {/* Phone */}
            <div className="bg-white rounded-2xl p-6 border border-brand-border flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Phone</p>
                <a href="tel:07450556963" className="font-bold text-brand-black hover:text-brand-red transition-colors">
                  07450 556 963
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-6 border border-brand-border flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">Email</p>
                <a href="mailto:info@autopilotdrivingschool.co.uk" className="font-bold text-brand-black hover:text-brand-red transition-colors">
                  info@autopilotdrivingschool.co.uk
                </a>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-2xl p-6 border border-brand-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-brand-black">Opening Hours</p>
              </div>
              <div className="space-y-2">
                {openingHours.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-brand-muted">{h.day}</span>
                    <span className="font-medium text-brand-black">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-4">
              {[
                { icon: InstagramIcon, href: "https://www.instagram.com/autopilotdrivingschool", label: "Instagram" },
                { icon: FacebookIcon, href: "https://www.facebook.com/people/Autopilot-DrivingSchool/100091995016715/", label: "Facebook" },
                { icon: TikTokIcon, href: "https://www.tiktok.com/@autopilotdrivingschool", label: "TikTok" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 bg-brand-black text-white rounded-xl flex items-center justify-center hover:bg-brand-red transition-colors duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right: Callback Form */}
          <div>
            <h2
              className="text-2xl font-bold text-brand-black mb-6"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              We Can Call You
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm">
              <CallbackForm />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
