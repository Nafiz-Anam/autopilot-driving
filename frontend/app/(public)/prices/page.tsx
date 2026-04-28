import type { Metadata } from "next";
import PricesPageClient from "./PricesPageClient";

export const metadata: Metadata = {
  title: "Driving Lesson Prices | AutoPilot",
  description:
    "Transparent driving lesson prices with no hidden costs. Choose from single lessons, block packages, intensive courses, and gift vouchers.",
};

export default function PricesPage() {
  return <PricesPageClient />;
}
