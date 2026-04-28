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
  promoDiscount: number;
  paymentIntentId: string | null;
  bookingReference: string | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setLessonType: (type: LessonType) => void;
  setTransmission: (t: "manual" | "automatic") => void;
  setInstructor: (instructor: InstructorPublic) => void;
  setPackage: (pkg: Package) => void;
  setDate: (date: Date) => void;
  setSlot: (slot: string) => void;
  setStudentDetails: (details: StudentDetails) => void;
  setPromoCode: (code: string) => void;
  setPromoDiscount: (discount: number) => void;
  setPaymentIntentId: (id: string) => void;
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
  promoDiscount: 0,
  paymentIntentId: null,
  bookingReference: null,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set({ currentStep: get().currentStep + 1 }),
      prevStep: () => set({ currentStep: Math.max(1, get().currentStep - 1) }),
      setLessonType: (lessonType) => set({ lessonType }),
      setTransmission: (transmission) => set({ transmission }),
      setInstructor: (selectedInstructor) => set({ selectedInstructor }),
      setPackage: (selectedPackage) => set({ selectedPackage }),
      setDate: (selectedDate) => set({ selectedDate }),
      setSlot: (selectedSlot) => set({ selectedSlot }),
      setStudentDetails: (studentDetails) => set({ studentDetails }),
      setPromoCode: (promoCode) => set({ promoCode }),
      setPromoDiscount: (promoDiscount) => set({ promoDiscount }),
      setPaymentIntentId: (paymentIntentId) => set({ paymentIntentId }),
      setBookingReference: (bookingReference) => set({ bookingReference }),
      reset: () => set(initialState),
    }),
    {
      name: "autopilot-booking",
      partialize: (state) => ({
        currentStep: state.currentStep,
        lessonType: state.lessonType,
        transmission: state.transmission,
        selectedInstructor: state.selectedInstructor,
        selectedPackage: state.selectedPackage,
        selectedDate: state.selectedDate,
        selectedSlot: state.selectedSlot,
        promoCode: state.promoCode,
        promoDiscount: state.promoDiscount,
      }),
    }
  )
);
