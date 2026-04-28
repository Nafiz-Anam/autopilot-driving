"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  isToday,
  isSameDay,
  isSunday,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import axios from "axios";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import { cn } from "@/lib/utils";

const ALL_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

interface SlotInfo {
  time: string;
  available: boolean;
}

export function Step4DateTime() {
  const {
    selectedDate,
    setDate,
    selectedSlot,
    setSlot,
    selectedInstructor,
    nextStep,
    prevStep,
  } = useBookingStore();

  const [viewMonth, setViewMonth] = useState(new Date());
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  async function handleDateClick(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    if (isBefore(normalized, today) || isSunday(date)) return;

    setDate(date);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSlot("" as any);
    setLoadingSlots(true);

    if (selectedInstructor) {
      try {
        const start = format(date, "yyyy-MM-dd");
        const end = format(addDays(date, 1), "yyyy-MM-dd");
        const { data } = await axios.get<{
          success: boolean;
          data: { date: string; slots: { time: string; available: boolean }[] }[];
        }>(
          `/api/bookings/availability?instructorId=${selectedInstructor.id}&startDate=${start}&endDate=${end}`
        );
        if (data.success && data.data.length > 0 && data.data[0].slots.length > 0) {
          setSlots(data.data[0].slots);
        } else {
          setSlots(ALL_SLOTS.map((t) => ({ time: t, available: true })));
        }
      } catch {
        setSlots(ALL_SLOTS.map((t) => ({ time: t, available: true })));
      }
    } else {
      setSlots(ALL_SLOTS.map((t) => ({ time: t, available: true })));
    }
    setLoadingSlots(false);
  }

  const isDisabledDay = (day: Date) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return isBefore(d, today) || isSunday(day);
  };

  const prevMonthDisabled =
    viewMonth.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth();

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-2xl font-extrabold text-brand-black"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          Pick a date &amp; time
        </h2>
        <p className="text-brand-muted mt-1 text-sm">
          Select a date then choose an available time slot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 mb-8">
        {/* ── Calendar ──────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => !prevMonthDisabled && setViewMonth(subMonths(viewMonth, 1))}
              disabled={prevMonthDisabled}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-brand-black" />
            </button>
            <h3 className="font-bold text-brand-black text-sm">
              {format(viewMonth, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-surface transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-brand-black" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div
                key={i}
                className={cn(
                  "text-center text-xs font-bold py-1",
                  i === 6 ? "text-brand-muted/40" : "text-brand-muted"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const disabled = isDisabledDay(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const today_ = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => inMonth && !disabled && handleDateClick(day)}
                  disabled={disabled || !inMonth}
                  className={cn(
                    "h-9 w-full rounded-lg text-xs font-medium transition-all duration-150 relative",
                    !inMonth
                      ? "opacity-15 cursor-default pointer-events-none"
                      : disabled
                      ? "text-brand-muted/30 cursor-not-allowed"
                      : isSelected
                      ? "bg-brand-red text-white font-bold shadow-sm"
                      : today_
                      ? "border-2 border-brand-red text-brand-red font-bold hover:bg-red-50"
                      : "text-brand-black hover:bg-brand-surface"
                  )}
                >
                  {format(day, "d")}
                  {/* Dot for today if not selected */}
                  {today_ && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-red" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-border text-xs text-brand-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-brand-red inline-block" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-brand-red inline-block" />
              Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-brand-muted/20 inline-block" />
              Unavailable
            </span>
          </div>
        </div>

        {/* ── Time slots ────────────────────────────────── */}
        <div>
          <AnimatePresence mode="wait">
            {!selectedDate ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[240px] bg-brand-surface rounded-2xl border border-brand-border gap-3"
              >
                <CalendarDays className="w-8 h-8 text-brand-muted/50" />
                <p className="text-brand-muted text-sm font-medium">
                  Select a date to see times
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-brand-muted" />
                  <h3 className="font-semibold text-brand-black text-sm">
                    {format(selectedDate, "EEEE, d MMMM")}
                  </h3>
                </div>

                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-11 rounded-xl bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-brand-surface rounded-2xl border border-brand-border gap-2">
                    <Clock className="w-6 h-6 text-brand-muted/50" />
                    <p className="text-sm text-brand-muted font-medium">
                      No slots available on this date
                    </p>
                    <p className="text-xs text-brand-muted">Try a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSlot(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 relative",
                            !slot.available
                              ? "border-brand-border text-brand-muted/40 line-through cursor-not-allowed bg-gray-50"
                              : isSelected
                              ? "bg-brand-red border-brand-red text-white shadow-sm"
                              : "border-brand-border text-brand-black hover:border-brand-red hover:text-brand-red hover:bg-red-50"
                          )}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={prevStep}
          className="px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
        >
          ← Back
        </button>
        <AnimatePresence>
          {selectedDate && selectedSlot && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={nextStep}
              className="px-10 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30"
            >
              Continue →
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
