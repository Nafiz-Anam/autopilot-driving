"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { ChevronDown, Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutopilotLogo } from "@/components/brand/AutopilotLogo";

const learnLinks = [
  { label: "Automatic & Manual", href: "/learn-to-drive/automatic-manual" },
  { label: "Intensive Courses", href: "/learn-to-drive/intensive-courses" },
  { label: "Refresher Lessons", href: "/learn-to-drive/refresher-lessons" },
  { label: "Female Instructors", href: "/learn-to-drive/female-instructors" },
  { label: "Pass Plus", href: "/learn-to-drive/pass-plus" },
  { label: "Theory Training", href: "/learn-to-drive/theory-training" },
];

const navLinks = [
  { label: "Prices", href: "/prices" },
  { label: "Areas", href: "/areas" },
  { label: "Become an Instructor", href: "/become-an-instructor" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-sm shadow-sm"
            : "bg-white"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <AutopilotLogo />

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Learn to Drive dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#E8200A]",
                    pathname.startsWith("/learn-to-drive")
                      ? "text-[#E8200A] border-b-2 border-[#FF5500]"
                      : "text-[#0D0D0D]"
                  )}
                >
                  Learn to Drive
                  <motion.span
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E5E5E5] rounded-xl shadow-lg overflow-hidden"
                    >
                      {learnLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "block px-4 py-3 text-sm font-medium transition-colors hover:bg-[#F5F5F5] hover:text-[#E8200A]",
                            pathname === link.href
                              ? "text-[#E8200A] bg-[#FFF5F5]"
                              : "text-[#0D0D0D]"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[#E8200A]",
                    pathname === link.href
                      ? "text-[#E8200A] border-b-2 border-[#FF5500]"
                      : "text-[#0D0D0D]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right actions */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="tel:07944722168"
                className="flex items-center gap-1.5 text-sm font-medium text-[#6B6B6B] hover:text-[#E8200A] transition-colors"
              >
                <Phone size={14} />
                07944 722168
              </a>
              {session ? (
                <Link
                  href={session.user.role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/dashboard"}
                  className="text-sm font-medium text-[#0D0D0D] hover:text-[#E8200A] transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#0D0D0D] hover:text-[#E8200A] transition-colors"
                >
                  Login
                </Link>
              )}
              <Link
                href="/booking"
                className="px-6 py-2.5 bg-[#E8200A] text-white text-sm font-medium rounded-full hover:bg-[#FF5500] transition-colors duration-200"
              >
                Book a Lesson
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-[#0D0D0D]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0D0D0D] flex flex-col pt-20 px-6 pb-8 overflow-y-auto"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              className="flex flex-col gap-2"
            >
              <MobileNavItem href="/learn-to-drive" label="Learn to Drive" />
              {learnLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                >
                  <Link
                    href={link.href}
                    className="block pl-4 py-2.5 text-[#6B6B6B] hover:text-[#FF5500] text-base font-medium border-l border-[#2A2A2A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {navLinks.map((link) => (
                <MobileNavItem key={link.href} href={link.href} label={link.label} />
              ))}
              <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex flex-col gap-3">
                {session ? (
                  <Link
                    href={session.user.role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/dashboard"}
                    className="text-center py-3 text-white font-medium border border-white/20 rounded-full"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="text-center py-3 text-white font-medium border border-white/20 rounded-full"
                  >
                    Login
                  </Link>
                )}
                <Link
                  href="/booking"
                  className="text-center py-3.5 bg-[#E8200A] text-white font-bold rounded-full"
                >
                  Book a Lesson
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16 lg:h-20" />
    </>
  );
}

function MobileNavItem({ href, label }: { href: string; label: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
    >
      <Link
        href={href}
        className="block py-3 text-white text-xl font-bold hover:text-[#FF5500] transition-colors"
      >
        {label}
      </Link>
    </motion.div>
  );
}
