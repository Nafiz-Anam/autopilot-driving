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

export const PACKAGES: Package[] = [
  {
    id: "single",
    name: "Single Lesson",
    lessons: 1,
    hours: 1,
    price: 42,
    pricePerLesson: 42,
    savings: 0,
    isPopular: false,
  },
  {
    id: "block5",
    name: "Block of 5 Lessons",
    lessons: 5,
    hours: 5,
    price: 195,
    pricePerLesson: 39,
    savings: 15,
    isPopular: true,
    badge: "Most Popular",
  },
  {
    id: "block10",
    name: "Block of 10 Lessons",
    lessons: 10,
    hours: 10,
    price: 380,
    pricePerLesson: 38,
    savings: 40,
    isPopular: false,
  },
  {
    id: "block20",
    name: "Block of 20 Lessons",
    lessons: 20,
    hours: 20,
    price: 720,
    pricePerLesson: 36,
    savings: 120,
    isPopular: false,
  },
];

export const INTENSIVE_PACKAGES: Package[] = [
  {
    id: "intensive_1week",
    name: "1-Week Intensive",
    lessons: 20,
    hours: 20,
    price: 680,
    pricePerLesson: 34,
    savings: 160,
    isPopular: false,
  },
  {
    id: "intensive_2week",
    name: "2-Week Intensive",
    lessons: 30,
    hours: 30,
    price: 900,
    pricePerLesson: 30,
    savings: 360,
    isPopular: true,
    badge: "Best Value",
  },
];
