import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { LearningJourney } from "@/components/home/LearningJourney";
import { AppFlowSlider } from "@/components/home/AppFlowSlider";
import { WhyAutopilot } from "@/components/home/WhyAutopilot";
import { Testimonials } from "@/components/home/Testimonials";
import { AreaTeaser } from "@/components/home/AreaTeaser";
import { CTABanner } from "@/components/home/CTABanner";

export const metadata: Metadata = {
  title: "AutoPilot Driving School | Learn to Drive with Autopilot",
  description:
    "UK's premier driving school covering Slough, Windsor, Reading, Maidenhead and surrounding areas. Expert DVSA-approved instructors. Book your first lesson today.",
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "AutoPilot Driving School",
      telephone: "+447944722168",
      email: "info@autopilotdrivingschool.co.uk",
      url: "https://autopilotdrivingschool.co.uk",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Slough",
        addressRegion: "Berkshire",
        addressCountry: "GB",
      },
      areaServed: ["Slough", "Windsor", "Maidenhead", "Reading", "Wokingham", "Bracknell"],
      description:
        "Premium driving school with DVSA-approved instructors covering East Berkshire and West London.",
    }),
  },
};

export default function HomePage() {
  return (
    <>
      {/* 1. White hero — full-screen, dot grid, floating instructor card */}
      <HeroSection />
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
