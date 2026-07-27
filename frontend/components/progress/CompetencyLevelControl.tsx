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

export const COMPETENCY_LEVEL_WEIGHT: Record<CompetencyLevel, number> = {
  NOT_COVERED: 0,
  NEEDS_PRACTICE: 1,
  UNDER_INSTRUCTION: 2,
  INDEPENDENT: 3,
};

export function computeScorePercent(
  scores: { level: CompetencyLevel | null; scorePercent?: number | null }[]
): number {
  const assessed = scores.filter(
    (s): s is { level: CompetencyLevel; scorePercent?: number | null } => s.level !== null
  );
  if (!assessed.length) return 0;
  const sum = assessed.reduce(
    (total, s) =>
      total + (s.scorePercent ?? Math.round((COMPETENCY_LEVEL_WEIGHT[s.level] / 3) * 100)),
    0
  );
  return Math.round(sum / assessed.length);
}

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

export function ScorePercentBadge({ percent }: { percent: number }) {
  const colorClasses =
    percent >= 70
      ? "bg-green-100 text-green-800 border-green-300"
      : percent >= 40
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-gray-200 text-brand-black border-gray-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border",
        colorClasses
      )}
    >
      Score: {percent}%
    </span>
  );
}

interface ScorePercentInputProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
}

export function ScorePercentInput({ value, onChange, readOnly = false }: ScorePercentInputProps) {
  if (readOnly) {
    return (
      <span className="text-xs font-semibold text-brand-black w-12 text-right tabular-nums">
        {value !== null ? `${value}%` : "—"}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange?.(null);
            return;
          }
          const num = Math.min(100, Math.max(0, Number(raw)));
          onChange?.(Number.isNaN(num) ? null : num);
        }}
        placeholder="—"
        className="w-16 px-2 py-1 border border-brand-border rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand-red/30"
      />
      <span className="text-xs text-brand-muted">%</span>
    </div>
  );
}

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
