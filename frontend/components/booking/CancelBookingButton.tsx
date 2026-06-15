"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useBookingStore } from "@/store/bookingStore";

export function CancelBookingButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { reset } = useBookingStore();
  const router = useRouter();

  function confirm() {
    reset();
    router.push("/");
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-6 py-3 border border-red-200 text-red-600 rounded-full font-semibold text-sm hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
      >
        ✕ Cancel
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-brand-black mb-2">Cancel booking?</h3>
              <p className="text-sm text-brand-muted mb-6">
                All your progress will be lost and you&apos;ll be taken back to the home page.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirm}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200"
                >
                  Yes, cancel
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-brand-border text-brand-black text-sm font-semibold rounded-xl hover:bg-brand-surface transition-colors duration-200"
                >
                  Keep going
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
