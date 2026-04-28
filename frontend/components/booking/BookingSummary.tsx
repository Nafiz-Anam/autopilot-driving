"use client";

import { format } from "date-fns";
import { Star, Clock, User, Package as PackageIcon, Calendar, Shield } from "lucide-react";
import { useBookingStore } from "@/store/bookingStore";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

function LessonLabel(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    MANUAL: "Manual Lesson",
    AUTOMATIC: "Automatic Lesson",
    INTENSIVE: "Intensive Course",
    REFRESHER: "Refresher Lesson",
    PASS_PLUS: "Pass Plus",
    THEORY: "Theory Test Prep",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

export function BookingSummary() {
  const {
    lessonType,
    transmission,
    selectedInstructor,
    selectedPackage,
    selectedDate,
    selectedSlot,
    promoDiscount,
  } = useBookingStore();

  const subtotal = selectedPackage?.price ?? 0;
  const total = Math.max(0, subtotal - promoDiscount);
  const initials = selectedInstructor?.user.name
    ? getInitials(selectedInstructor.user.name)
    : "??";

  return (
    <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm sticky top-6">
      {/* Header stripe */}
      <div
        className="px-6 py-4"
        style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
      >
        <h3 className="font-bold text-white text-base tracking-wide">Booking Summary</h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Instructor */}
        {selectedInstructor && (
          <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)" }}
            >
              {selectedInstructor.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedInstructor.user.image}
                  alt={selectedInstructor.user.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-black text-sm truncate">
                {selectedInstructor.user.name}
              </p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-brand-muted">
                  {selectedInstructor.rating.toFixed(1)} · {selectedInstructor.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lesson details */}
        <div className="space-y-3 text-sm">
          {lessonType && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-brand-muted">
                <User className="w-3.5 h-3.5 shrink-0" />
                Lesson Type
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="font-medium text-brand-black">{LessonLabel(lessonType)}</span>
                {transmission && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      transmission === "manual"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    )}
                  >
                    {transmission === "manual" ? "Manual" : "Automatic"}
                  </span>
                )}
              </div>
            </div>
          )}

          {selectedPackage && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-brand-muted">
                <PackageIcon className="w-3.5 h-3.5 shrink-0" />
                Package
              </span>
              <span className="font-medium text-brand-black text-right">{selectedPackage.name}</span>
            </div>
          )}

          {selectedDate && selectedSlot && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-brand-muted">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Date
              </span>
              <span className="font-medium text-brand-black text-right">
                {format(selectedDate, "EEE d MMM")}
              </span>
            </div>
          )}

          {selectedSlot && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-brand-muted">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Time
              </span>
              <span className="font-medium text-brand-black">{selectedSlot}</span>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        {selectedPackage && (
          <div className="border-t border-dashed border-brand-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">
                {selectedPackage.lessons === 1
                  ? "1 lesson"
                  : `${selectedPackage.lessons} lessons`}
                {" "}× £{selectedPackage.pricePerLesson}
              </span>
              <span className="text-brand-black font-medium">£{subtotal}</span>
            </div>

            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium flex items-center gap-1">
                  Voucher discount
                </span>
                <span className="text-green-600 font-semibold">−£{promoDiscount}</span>
              </div>
            )}

            <div className="border-t-2 border-brand-border pt-3 flex justify-between items-baseline">
              <span className="font-bold text-brand-black">Total</span>
              <span className="text-2xl font-extrabold text-brand-red">£{total}</span>
            </div>
          </div>
        )}

        {/* Savings callout */}
        {selectedPackage && selectedPackage.savings > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-brand-orange font-semibold text-center">
            You're saving £{selectedPackage.savings} with this package!
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted pt-1">
          <Shield className="w-3 h-3" />
          <span>Secure payment via Stripe. SSL encrypted.</span>
        </div>
      </div>
    </div>
  );
}
