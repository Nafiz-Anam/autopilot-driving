"use client";

import { cn } from "@/lib/utils";

export type CompetencyLevel =
  | "NOT_COVERED"
  | "NEEDS_PRACTICE"
  | "UNDER_INSTRUCTION"
  | "INDEPENDENT";

export const COMPETENCY_LEVELS: CompetencyLevel[] = [
  "NOT_COVERED",
  "NEEDS_PRACTICE",
  "UNDER_INSTRUCTION",
  "INDEPENDENT",
];

export const COMPETENCY_LEVEL_CONFIG: Record<
  CompetencyLevel,
  { label: string; shortLabel: string; activeClasses: string; dotClasses: string }
> = {
  NOT_COVERED: {
    label: "Not Covered",
    shortLabel: "Not Covered",
    activeClasses: "bg-gray-200 text-brand-black border-gray-300",
    dotClasses: "bg-gray-400",
  },
  NEEDS_PRACTICE: {
    label: "Needs Practice",
    shortLabel: "Needs Practice",
    activeClasses: "bg-amber-100 text-amber-800 border-amber-300",
    dotClasses: "bg-amber-500",
  },
  UNDER_INSTRUCTION: {
    label: "Under Instruction",
    shortLabel: "Under Instruction",
    activeClasses: "bg-blue-100 text-blue-800 border-blue-300",
    dotClasses: "bg-blue-500",
  },
  INDEPENDENT: {
    label: "Independent",
    shortLabel: "Independent",
    activeClasses: "bg-green-100 text-green-800 border-green-300",
    dotClasses: "bg-green-500",
  },
};

interface CompetencyLevelControlProps {
  value: CompetencyLevel | null;
  onChange?: (level: CompetencyLevel) => void;
  readOnly?: boolean;
}

export function CompetencyLevelControl({
  value,
  onChange,
  readOnly = false,
}: CompetencyLevelControlProps) {
  if (readOnly) {
    const config = value ? COMPETENCY_LEVEL_CONFIG[value] : null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
          config ? config.activeClasses : "bg-gray-100 text-brand-muted border-gray-200"
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", config ? config.dotClasses : "bg-gray-300")} />
        {config ? config.label : "Not Assessed"}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {COMPETENCY_LEVELS.map((level) => {
        const config = COMPETENCY_LEVEL_CONFIG[level];
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange?.(level)}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
              active
                ? config.activeClasses
                : "bg-white text-brand-muted border-brand-border hover:bg-brand-surface"
            )}
          >
            {config.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
