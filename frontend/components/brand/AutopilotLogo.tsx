"use client";

import Link from "next/link";
import Image from "next/image";
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
  return (
    <Link
      href={href}
      className={cn("flex items-center shrink-0 transition-opacity hover:opacity-90", className)}
    >
      <Image
        src="/autopilot-logo-transparent.png"
        alt="AutoPilot Driving School"
        width={size === "compact" ? 140 : 180}
        height={size === "compact" ? 35 : 45}
        className="h-auto w-auto object-contain"
        priority
        unoptimized
      />
    </Link>
  );
}
