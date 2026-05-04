"use client";

import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type AutopilotLogoProps = {
  href?: string;
  /** Extra classes on the root link */
  className?: string;
  /** Slightly smaller type + icon for sidebars */
  size?: "default" | "compact";
};

export function AutopilotLogo({
  href = "/",
  className,
  size = "default",
}: AutopilotLogoProps) {
  const gradId = `logo-grad-${useId().replace(/:/g, "")}`;

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 shrink-0 group", className)}
    >
      <svg
        className={cn("shrink-0", size === "compact" ? "w-8 h-8" : "w-9 h-9")}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8200A" />
            <stop offset="100%" stopColor="#FF5500" />
          </linearGradient>
        </defs>
        <path
          d="M18 4L32 28H22L18 20L14 28H4L18 4Z"
          fill={`url(#${gradId})`}
        />
        <path
          d="M18 12L26 28H22L18 20L14 28H10L18 12Z"
          fill="white"
          opacity="0.3"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold tracking-tight text-brand-red",
            size === "compact" ? "text-sm" : "text-xl"
          )}
          style={{
            fontFamily: "'Moderniz', 'Barlow', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          AUTOPILOT
        </span>
        <span
          className={cn(
            "font-medium text-brand-orange tracking-widest",
            size === "compact" ? "text-[9px]" : "text-xs"
          )}
          style={{ fontFamily: "'Metropolis', 'DM Sans', sans-serif" }}
        >
          DRIVING SCHOOL
        </span>
      </div>
    </Link>
  );
}
