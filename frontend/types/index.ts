import type { LessonType, BookingStatus, PaymentStatus, Role } from "@prisma/client";

export type { LessonType, BookingStatus, PaymentStatus, Role };

export interface InstructorPublic {
  id: string;
  userId: string;
  bio: string | null;
  photoUrl: string | null;
  rating: number;
  reviewCount: number;
  yearsExp: number;
  transmission: string[];
  areas: string[];
  pricePerHour: number;
  isFemale: boolean;
  isActive: boolean;
  user: {
    name: string;
    image: string | null;
  };
}

export interface Package {
  id: string;
  name: string;
  lessons: number;
  hours: number;
  price: number;
  pricePerLesson: number;
  savings: number;
  isPopular: boolean;
  badge?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityDay {
  date: string;
  slots: TimeSlot[];
}

export interface BookingWizardState {
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
  bookingReference: string | null;
}

export interface StudentDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  provisionalLicence?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BookingPublic {
  id: string;
  reference: string;
  lessonType: LessonType;
  transmission: string;
  scheduledAt: string;
  durationMins: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  instructor: {
    user: { name: string; image: string | null };
    rating: number;
    areas: string[];
  };
}

