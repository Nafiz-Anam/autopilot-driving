"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend-api";

interface CoverageResult {
  covered: boolean;
  area?: { name: string; postcodePrefix: string };
}

interface PostcodeSearchProps {
  placeholder?: string;
  buttonLabel?: string;
  variant?: "default" | "white" | "dark";
  onSearch?: (postcode: string) => void;
  redirectTo?: string;
  checkCoverage?: boolean;
  className?: string;
}

export function PostcodeSearch({
  placeholder = "Enter your postcode",
  buttonLabel = "Find Instructor",
  variant = "default",
  onSearch,
  redirectTo = "/booking",
  checkCoverage = false,
  className,
}: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) return;

    if (onSearch) {
      onSearch(postcode.trim());
      return;
    }

    if (!checkCoverage) {
      router.push(`${redirectTo}?postcode=${encodeURIComponent(postcode.trim())}`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get<{ success: boolean; data: CoverageResult }>(
        backendApiUrl(`/public/areas?postcode=${encodeURIComponent(postcode.trim())}`)
      );
      if (data.success) {
        setResult(data.data);
      } else {
        setError("Could not check coverage. Please try again.");
      }
    } catch {
      setError("Could not check coverage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex gap-0">
        <input
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          placeholder={placeholder}
          maxLength={8}
          className={cn(
            "flex-1 min-w-0 px-5 py-3.5 text-sm font-medium rounded-l-full border-2 border-r-0 outline-none transition-colors",
            variant === "white"
              ? "bg-white/10 text-white placeholder:text-white/60 border-white/30 focus:border-white"
              : variant === "dark"
              ? "bg-white text-[#0D0D0D] placeholder:text-[#6B6B6B] border-[#E5E5E5] focus:border-[#E8200A]"
              : "bg-white text-[#0D0D0D] placeholder:text-[#6B6B6B] border-[#E5E5E5] focus:border-[#E8200A]"
          )}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3.5 bg-[#E8200A] text-white text-sm font-bold rounded-r-full hover:bg-[#FF5500] transition-colors duration-200 flex-shrink-0 disabled:opacity-60"
        >
          <Search size={16} />
          {loading ? "Checking…" : buttonLabel}
        </button>
      </form>

      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-4 p-4 rounded-2xl text-center",
            result.covered
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-[#E8200A]"
          )}
        >
          {result.covered ? (
            <>
              <p className="font-bold text-base">Great news! We cover your area.</p>
              <p className="text-sm mt-1">
                {result.area?.name} ({result.area?.postcodePrefix}) is one of our active coverage zones.
              </p>
              <Link
                href={`${redirectTo}?postcode=${encodeURIComponent(postcode)}`}
                className="mt-3 inline-block px-6 py-2 bg-[#E8200A] text-white rounded-full font-semibold text-sm hover:bg-[#FF5500] transition-colors duration-200"
              >
                Book a Lesson
              </Link>
            </>
          ) : (
            <>
              <p className="font-bold text-base">Sorry, we don&apos;t cover this area yet.</p>
              <p className="text-sm mt-1">
                Leave your details and we&apos;ll notify you when we expand.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block px-6 py-2 bg-[#E8200A] text-white rounded-full font-semibold text-sm hover:bg-[#FF5500] transition-colors duration-200"
              >
                Contact Us
              </Link>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
