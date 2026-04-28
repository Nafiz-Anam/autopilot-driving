"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <AlertTriangle className="w-10 h-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1
            className="text-3xl font-extrabold text-brand-black mb-3"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
          >
            Something went wrong.
          </h1>
          <p className="text-brand-muted mb-2">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-brand-muted font-mono bg-brand-surface rounded px-2 py-1 inline-block mb-6">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 border border-brand-border text-brand-black rounded-full font-semibold hover:border-brand-red hover:text-brand-red transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
