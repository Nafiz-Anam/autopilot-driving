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

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const openingHours = [
  { day: "Monday – Friday", hours: "8:00am – 7:00pm" },
  { day: "Saturday", hours: "8:00am – 5:00pm" },
  { day: "Sunday", hours: "10:00am – 3:00pm" },
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
                <a href="tel:+441234567890" className="font-bold text-brand-black hover:text-brand-red transition-colors">
                  01234 567 890
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
                <a href="mailto:hello@autopilotdriving.co.uk" className="font-bold text-brand-black hover:text-brand-red transition-colors">
                  hello@autopilotdriving.co.uk
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
                { icon: InstagramIcon, href: "#", label: "Instagram" },
                { icon: FacebookIcon, href: "#", label: "Facebook" },
                { icon: TwitterIcon, href: "#", label: "Twitter" },
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

      {/* Map */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden border border-brand-border shadow-sm">
          <iframe
            src="https://maps.google.com/maps?q=Slough+SL1&output=embed"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>
    </>
  );
}
