import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D0D0D] text-white border-t-2 border-[#FF5500]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-1">
            <AutopilotLogo className="mb-4" size="compact" />
            <p className="text-[#9A9A9A] text-sm leading-relaxed mb-4">
              UK&apos;s premier driving school. Expert DVSA-approved instructors covering East London, Tower Hamlets, Newham, Barking &amp; Dagenham and surrounding areas.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.instagram.com/autopilotdrivingschool" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <InstagramIcon size={18} />
              </a>
              <a href="https://www.facebook.com/people/Autopilot-DrivingSchool/100091995016715/" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <FacebookIcon size={18} />
              </a>
              <a href="https://www.tiktok.com/@autopilotdrivingschool" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <TikTokIcon size={18} />
              </a>
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {[
{ label: "Prices", href: "/prices" },
                { label: "Areas We Cover", href: "/areas" },
                { label: "Blog", href: "/blog" },
                { label: "Become an Instructor", href: "/become-an-instructor" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Refund Policy", href: "/refund" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#6B6B6B] hover:text-[#FF5500] text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn to Drive links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Learn to Drive</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Automatic & Manual", href: "/learn-to-drive/automatic-manual" },
                { label: "Intensive Courses", href: "/learn-to-drive/intensive-courses" },
                { label: "Refresher Lessons", href: "/learn-to-drive/refresher-lessons" },
                { label: "Female Instructors", href: "/learn-to-drive/female-instructors" },
                { label: "Pass Plus", href: "/learn-to-drive/pass-plus" },
                { label: "Theory Training", href: "/learn-to-drive/theory-training" },
                { label: "Mock Test", href: "/learn-to-drive/mock-test" },
                { label: "Motorway", href: "/learn-to-drive/motorway" },
                { label: "Gift Vouchers", href: "/booking/gift-voucher" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#6B6B6B] hover:text-[#FF5500] text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:07450556963" className="flex items-start gap-2.5 text-[#9A9A9A] hover:text-[#FF5500] transition-colors text-sm">
                  <Phone size={16} className="mt-0.5 flex-shrink-0" />
                  07450 556 963
                </a>
              </li>
              <li>
                <a href="mailto:info@autopilotdrivingschool.co.uk" className="flex items-start gap-2.5 text-[#9A9A9A] hover:text-[#FF5500] transition-colors text-sm">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  info@autopilotdrivingschool.co.uk
                </a>
              </li>
              <li className="text-[#9A9A9A] text-sm mt-2">
                <span className="text-white font-medium block mb-1">Opening Hours</span>
                Mon–Fri: 9am–7pm<br />
                Sat: 10am–4pm<br />
                Sun: Closed
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#6B6B6B] text-xs">
            © {currentYear} AutoPilot Driving School. All rights reserved. Developed by{" "}
            <a
              href="https://agiloit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6B6B] hover:text-[#9A9A9A] transition-colors"
            >
              Agilo IT
            </a>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#2A2A2A]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#E8200A" strokeWidth="1.5" />
                <path d="M4 6l1.5 1.5L8 4" stroke="#E8200A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              DVSA Approved
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
