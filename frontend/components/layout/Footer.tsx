import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

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

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                <defs>
                  <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E8200A" />
                    <stop offset="100%" stopColor="#FF5500" />
                  </linearGradient>
                </defs>
                <path d="M18 4L32 28H22L18 20L14 28H4L18 4Z" fill="url(#footer-logo-gradient)" />
                <path d="M18 12L26 28H22L18 20L14 28H10L18 12Z" fill="white" opacity="0.3" />
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold text-white" style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif" }}>
                  AUTOPILOT
                </span>
                <span className="text-xs text-[#FF5500] tracking-widest">DRIVING SCHOOL</span>
              </div>
            </Link>
            <p className="text-[#6B6B6B] text-sm leading-relaxed mb-4">
              UK&apos;s premier driving school. Expert DVSA-approved instructors covering East Berkshire and West London.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <FacebookIcon size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <InstagramIcon size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="p-2 text-[#6B6B6B] hover:text-[#FF5500] transition-colors">
                <TwitterIcon size={18} />
              </a>
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Us", href: "/about" },
                { label: "Prices", href: "/prices" },
                { label: "Areas We Cover", href: "/areas" },
                { label: "Become an Instructor", href: "/become-an-instructor" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
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
                <a href="tel:07944722168" className="flex items-start gap-2.5 text-[#6B6B6B] hover:text-[#FF5500] transition-colors text-sm">
                  <Phone size={16} className="mt-0.5 flex-shrink-0" />
                  07944 722168
                </a>
              </li>
              <li>
                <a href="mailto:info@autopilotdrivingschool.co.uk" className="flex items-start gap-2.5 text-[#6B6B6B] hover:text-[#FF5500] transition-colors text-sm">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" />
                  info@autopilotdrivingschool.co.uk
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-[#6B6B6B] text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                Slough, Berkshire & surrounding areas
              </li>
              <li className="text-[#6B6B6B] text-sm mt-2">
                <span className="text-white font-medium block mb-1">Opening Hours</span>
                Mon–Fri: 8am–8pm<br />
                Sat–Sun: 9am–6pm
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#6B6B6B] text-xs">
            © {currentYear} AutoPilot Driving School. All rights reserved.
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
