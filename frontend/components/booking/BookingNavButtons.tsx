"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";

interface BookingNavButtonsProps {
  onBack: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  continueType?: "button" | "submit";
  disabled?: boolean;
  showCancel?: boolean;
}

/**
 * Mobile: Continue full-width on top, Back + Cancel in a row below.
 * Desktop: Back | Continue | Cancel in a single row.
 */
export function BookingNavButtons({
  onBack,
  onContinue,
  continueLabel = "Continue →",
  canContinue = true,
  continueType = "button",
  disabled = false,
  showCancel = true,
}: BookingNavButtonsProps) {
  const continueBtn = (
    <AnimatePresence>
      {canContinue && (
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          type={continueType}
          onClick={continueType === "button" ? onContinue : undefined}
          disabled={disabled}
          className="w-full sm:w-auto px-10 py-3 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30 disabled:opacity-60"
        >
          {continueLabel}
        </motion.button>
      )}
    </AnimatePresence>
  );

  const backBtn = (
    <button
      type="button"
      onClick={onBack}
      className="px-6 py-3 border border-brand-border text-brand-black rounded-full font-semibold text-sm hover:border-brand-red hover:text-brand-red transition-colors duration-200"
    >
      ← Back
    </button>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden w-full">
        {canContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type={continueType}
            onClick={continueType === "button" ? onContinue : undefined}
            disabled={disabled}
            className="w-full py-3.5 bg-brand-red text-white rounded-full font-bold text-sm hover:bg-brand-orange active:scale-95 transition-all duration-200 shadow-md shadow-brand-red/30 disabled:opacity-60"
          >
            {continueLabel}
          </motion.button>
        )}
        <div className="flex items-center justify-between gap-3">
          {backBtn}
          {showCancel && <CancelBookingButton className="ml-0" />}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {backBtn}
        {continueBtn}
        {showCancel && <CancelBookingButton className="ml-0" />}
      </div>
    </>
  );
}
