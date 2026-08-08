import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { StatsBar } from "@/components/home/StatsBar";
import { LearningJourney } from "@/components/home/LearningJourney";
import { AppFlowSlider } from "@/components/home/AppFlowSlider";
import { WhyAutopilot } from "@/components/home/WhyAutopilot";
import { Testimonials } from "@/components/home/Testimonials";
import { AreaTeaser } from "@/components/home/AreaTeaser";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "Autopilot Driving School | Learn to Drive with Autopilot",
  description:
    "Autopilot is an online booking platform for driving lessons in the UK. Learners search DVSA-approved instructors, book and manage lessons, and track progress. Instructors manage their schedule and can sync bookings to Google Calendar.",
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Autopilot Driving School",
      telephone: "+447450556963",
      email: "info@autopilotdrivingschool.co.uk",
      url: "https://autopilotdrivingschool.co.uk",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ilford",
        addressRegion: "Berkshire",
        addressCountry: "GB",
      },
      areaServed: ["Ilford", "Romford", "Barking", "Dagenham", "Wanstead", "Chigwell"],
      description:
        "Autopilot is an online booking platform for driving lessons. Learners search DVSA-approved instructors, book and manage lessons, and track progress. Instructors manage their schedule and can sync bookings to Google Calendar.",
    }),
  },
};

export default function HomePage() {
  return (
    <>
      {/* 1. White hero — full-screen, dot grid, floating instructor card */}
      <HeroSection />
      {/* 1b. Plain-text app description — required for Google OAuth verification */}
      <AboutSection />
      {/* 2. Dark — animated count-up stats for instant social proof */}
      <StatsBar />
      {/* 3. White — step-by-step journey with gradient progress line */}
      <LearningJourney />
      {/* 4. Gray — app flow slider showing the booking process */}
      <AppFlowSlider />
      {/* 5. Off-white — 2×2 feature cards with hover transforms */}
      <WhyAutopilot />
      {/* 5. White — testimonial carousel with large quote marks */}
      <Testimonials />
      {/* 6. Dark — area coverage split layout */}
      <AreaTeaser />
      {/* 7. Red gradient — premium CTA finish */}
      <CTABanner />
    </>
  );
}
