import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theory Training | AutoPilot Driving School",
  description: "Interactive theory test practice for AutoPilot students.",
};

export default function TheoryTrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
