import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theory Training | Autopilot Driving School",
  description: "Interactive theory test practice for Autopilot students.",
};

export default function TheoryTrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
