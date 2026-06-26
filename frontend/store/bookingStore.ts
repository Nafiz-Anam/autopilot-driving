"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LessonType, InstructorPublic, Package, StudentDetails } from "@/types";

interface BookingStore {
  currentStep: number;
  lessonType: LessonType | null;
  transmission: "manual" | "automatic" | null;
  selectedInstructor: InstructorPublic | null;
  selectedPackage: Package | null;
  selectedDate: Date | null;
  selectedSlot: string | null;
  studentDetails: StudentDetails | null;
  promoCode: string | null;
  promoKind: "gift_voucher" | "coupon" | null;
  promoDiscount: number;
  paymentIntentId: string | null;
  bookingId: string | null;
  bookingReference: string | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setLessonType: (type: LessonType) => void;
  setTransmission: (t: "manual" | "automatic") => void;
  setInstructor: (instructor: InstructorPublic) => void;
  setPackage: (pkg: Package | null) => void;
  setDate: (date: Date) => void;
  setSlot: (slot: string) => void;
  setStudentDetails: (details: StudentDetails) => void;
  setPromoCode: (code: string) => void;
  setPromoKind: (kind: "gift_voucher" | "coupon" | null) => void;
  setPromoDiscount: (discount: number) => void;
  setPaymentIntentId: (id: string) => void;
  setBookingId: (id: string | null) => void;
  setBookingReference: (ref: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  lessonType: null,
  transmission: null,
  selectedInstructor: null,
  selectedPackage: null,
  selectedDate: null,
  selectedSlot: null,
  studentDetails: null,
  promoCode: null,
  promoKind: null,
  promoDiscount: 0,
  paymentIntentId: null,
  bookingId: null,
  bookingReference: null,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const { currentStep, lessonType } = get();
        const isTheory = lessonType === 'THEORY';
        // THEORY skips instructor (2) and date/time (4)
        let next = currentStep + 1;
        if (isTheory && (next === 2 || next === 4)) next++;
        set({ currentStep: next });
      },
      prevStep: () => {
        const { currentStep, lessonType } = get();
        const isTheory = lessonType === 'THEORY';
        let prev = Math.max(1, currentStep - 1);
        if (isTheory && (prev === 2 || prev === 4)) prev--;
        set({ currentStep: Math.max(1, prev) });
      },
      setLessonType: (lessonType) => set({ lessonType }),
      setTransmission: (transmission) => set({ transmission }),
      setInstructor: (selectedInstructor) => set({ selectedInstructor }),
      setPackage: (selectedPackage) => set({ selectedPackage }),
      setDate: (selectedDate) => set({ selectedDate }),
      setSlot: (selectedSlot) => set({ selectedSlot }),
      setStudentDetails: (studentDetails) => set({ studentDetails }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setPromoKind: (promoKind) => set({ promoKind }),
      setPromoDiscount: (promoDiscount) => set({ promoDiscount }),
      setPaymentIntentId: (paymentIntentId) => set({ paymentIntentId }),
      setBookingId: (bookingId) => set({ bookingId }),
      setBookingReference: (bookingReference) => set({ bookingReference }),
      reset: () => set(initialState),
    }),
    {
      name: "autopilot-booking-v2",
      onRehydrateStorage: () => (state) => {
        if (state?.selectedDate && typeof state.selectedDate === "string") {
          state.selectedDate = new Date(state.selectedDate);
        }
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        lessonType: state.lessonType,
        transmission: state.transmission,
        selectedInstructor: state.selectedInstructor,
        selectedPackage: state.selectedPackage,
        selectedDate: state.selectedDate,
        selectedSlot: state.selectedSlot,
        promoCode: state.promoCode,
        promoKind: state.promoKind,
        promoDiscount: state.promoDiscount,
        paymentIntentId: state.paymentIntentId,
        bookingId: state.bookingId,
        bookingReference: state.bookingReference,
      }),
    }
  )
);
