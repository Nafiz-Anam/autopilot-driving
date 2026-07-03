import type { Metadata } from "next";
import AreasPageClient from "./AreasPageClient";

export const metadata: Metadata = {
  title: "Areas We Cover | AutoPilot",
  description:
    "AutoPilot Driving School covers Ilford, Romford, Barking, Dagenham, Wanstead, Chigwell, Brentwood, Upminster, and Hornchurch. Check your postcode today.",
};

export default function AreasPage() {
  return <AreasPageClient />;
}
