import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us | AutoPilot",
  description:
    "Get in touch with AutoPilot Driving School. Call, email, or fill in the callback form and we'll get back to you fast.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
