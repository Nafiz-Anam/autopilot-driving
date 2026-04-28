"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostcodeSearchProps {
  placeholder?: string;
  buttonLabel?: string;
  variant?: "default" | "white" | "dark";
  onSearch?: (postcode: string) => void;
  redirectTo?: string;
  className?: string;
}

export function PostcodeSearch({
  placeholder = "Enter your postcode",
  buttonLabel = "Find Instructor",
  variant = "default",
  onSearch,
  redirectTo = "/booking",
  className,
}: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) return;
    if (onSearch) {
      onSearch(postcode.trim());
    } else {
      router.push(`${redirectTo}?postcode=${encodeURIComponent(postcode.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-0", className)}>
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
        className="flex items-center gap-2 px-6 py-3.5 bg-[#E8200A] text-white text-sm font-bold rounded-r-full hover:bg-[#FF5500] transition-colors duration-200 flex-shrink-0"
      >
        <Search size={16} />
        {buttonLabel}
      </button>
    </form>
  );
}
