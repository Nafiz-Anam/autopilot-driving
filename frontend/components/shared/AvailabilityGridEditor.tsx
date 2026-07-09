"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvailabilityCellState = "available" | "unavailable";
export type AvailabilityGrid = Record<string, AvailabilityCellState>;
export type AvailabilitySlot = { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, "0") + ":00");
const DAY_TO_INDEX: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
const INDEX_TO_DAY: Record<number, string> = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };

export function buildDefaultAvailabilityGrid(): AvailabilityGrid {
  const grid: AvailabilityGrid = {};
  for (const day of DAYS) for (const hour of HOURS) {
    const h = parseInt(hour);
    grid[`${day}-${hour}`] = day !== "Sunday" && h >= 8 && h < 21 ? "available" : "unavailable";
  }
  return grid;
}

function slotsToGrid(slots: Array<{ dayOfWeek: number; startTime: string; isAvailable: boolean }>): AvailabilityGrid {
  const grid = buildDefaultAvailabilityGrid();
  Object.keys(grid).forEach((k) => (grid[k] = "unavailable"));
  for (const slot of slots) {
    const day = INDEX_TO_DAY[slot.dayOfWeek];
    if (!day) continue;
    const hour = slot.startTime.slice(0, 5);
    const key = `${day}-${hour}`;
    if (key in grid) grid[key] = slot.isAvailable ? "available" : "unavailable";
  }
  return grid;
}

// Every day x hour cell is sent on every save (both available and
// unavailable), not just the available ones -- the backend read-back
// reconstructs the grid from this full set, so trimming it breaks round-tripping.
function gridToSlots(grid: AvailabilityGrid): AvailabilitySlot[] {
  return Object.entries(grid).map(([key, state]) => {
    const [day, hour] = key.split(/-(?=\d{2}:)/);
    const [h] = hour.split(":").map(Number);
    const endHour = String((h + 1) % 24).padStart(2, "0");
    return { dayOfWeek: DAY_TO_INDEX[day] ?? 1, startTime: `${hour}:00`, endTime: `${endHour}:00:00`, isAvailable: state === "available" };
  });
}

export default function AvailabilityGridEditor({
  fetchSchedule,
  saveSchedule,
}: {
  fetchSchedule: () => Promise<Response>;
  saveSchedule: (slots: AvailabilitySlot[]) => Promise<Response>;
}) {
  const [grid, setGrid] = useState<AvailabilityGrid>(buildDefaultAvailabilityGrid);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSchedule();
      if (res.ok) {
        const json = await res.json();
        const slots: Array<{ dayOfWeek: number; startTime: string; isAvailable: boolean }> = json.data ?? [];
        setGrid(slotsToGrid(slots));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSchedule]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveSchedule(gridToSlots(grid));
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to save schedule");
        return;
      }
      toast.success("Schedule saved");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-brand-border">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 500 }}>
          <thead>
            <tr>
              <th className="sticky left-0 bg-brand-surface px-3 py-2.5 text-left font-semibold text-brand-muted w-16 border-b border-brand-border">Time</th>
              {DAYS.map((d) => (
                <th key={d} className="px-1.5 py-2.5 text-center font-semibold text-brand-black bg-brand-surface border-b border-brand-border whitespace-nowrap">
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, rowIdx) => (
              <tr key={hour} className={cn("border-t border-brand-border/50", rowIdx % 2 === 0 ? "bg-white" : "bg-brand-surface/30")}>
                <td className="sticky left-0 bg-inherit px-3 py-1 font-medium text-brand-muted whitespace-nowrap">{hour}</td>
                {DAYS.map((day) => {
                  const key = `${day}-${hour}`;
                  const isAvail = grid[key] === "available";
                  return (
                    <td key={day} className="px-1 py-1">
                      <button type="button"
                        onClick={() => setGrid((p) => ({ ...p, [key]: p[key] === "available" ? "unavailable" : "available" }))}
                        className={cn("w-full h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                          isAvail ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200" : "bg-white border-brand-border hover:border-brand-red hover:bg-red-50")}>
                        {isAvail && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-4 text-xs text-brand-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded inline-block" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white border-2 border-brand-border rounded inline-block" /> Unavailable</span>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 bg-brand-red text-white hover:bg-brand-orange disabled:opacity-60">
          {saving ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : "Save Schedule"}
        </button>
      </div>
    </>
  );
}
