import type { Metadata } from "next";
import { Suspense } from "react";
import BookingPageClient from "./BookingPageClient";

export const metadata: Metadata = {
  title: "Book a Lesson | AutoPilot",
  description:
    "Book your driving lesson with AutoPilot Driving School. Choose your instructor, package, and preferred time slot in minutes.",
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-brand-surface" aria-hidden />}
    >
      <BookingPageClient />
    </Suspense>
  );
}
