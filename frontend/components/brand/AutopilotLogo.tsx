"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type AutopilotLogoProps = {
  href?: string;
  /** Extra classes on the root link */
  className?: string;
  /** Smaller for the navbar, larger for the footer brand mark */
  size?: "default" | "compact" | "large";
};

const DIMENSIONS = {
  compact: { width: 140, height: 35, heightClass: "h-[35px]" },
  default: { width: 180, height: 45, heightClass: "h-[45px]" },
  large: { width: 240, height: 60, heightClass: "h-[60px]" },
} as const;

export function AutopilotLogo({
  href = "/",
  className,
  size = "default",
}: AutopilotLogoProps) {
  const { width, height, heightClass } = DIMENSIONS[size];

  return (
    <Link
      href={href}
      className={cn("flex items-center shrink-0 transition-opacity hover:opacity-90", className)}
    >
      <Image
        src="/autopilot-logo-transparent.png"
        alt="Autopilot Driving School"
        width={width}
        height={height}
        className={cn("w-auto", heightClass)}
        priority
        unoptimized
      />
    </Link>
  );
}
