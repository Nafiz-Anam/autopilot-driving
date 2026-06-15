"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "autopilot_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[9999]"
        >
          <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-5 relative">
            {/* Close */}
            <button
              onClick={decline}
              aria-label="Decline cookies"
              className="absolute top-3.5 right-3.5 p-1 text-[#555] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-[#E8200A]/10 rounded-lg flex-shrink-0">
                <Cookie size={18} className="text-[#E8200A]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">We use cookies</p>
                <p className="text-[#888] text-xs mt-0.5 leading-relaxed">
                  We use essential and analytics cookies to improve your experience on our site.
                  Read our{" "}
                  <Link href="/privacy" className="text-[#E8200A] hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  to learn more.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={decline}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-[#888] hover:text-white hover:border-white/20 text-xs font-medium transition-all duration-200"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="flex-1 px-4 py-2 rounded-xl bg-[#E8200A] hover:bg-[#c41a08] text-white text-xs font-semibold transition-colors duration-200"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
