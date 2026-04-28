import type { Metadata } from "next";
import AreasPageClient from "./AreasPageClient";

export const metadata: Metadata = {
  title: "Areas We Cover | AutoPilot",
  description:
    "AutoPilot Driving School covers Slough, Windsor, Maidenhead, Reading, Wokingham, Bracknell, Staines, Feltham, and Hounslow. Check your postcode today.",
};

export default function AreasPage() {
  return <AreasPageClient />;
}
