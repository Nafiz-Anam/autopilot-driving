import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "AutoPilot Driving School | Learn to Drive with Autopilot",
    template: "%s | AutoPilot Driving School",
  },
  description:
    "UK's premier driving school. Expert DVSA-approved instructors covering Slough, Windsor, Reading, Maidenhead and surrounding areas. Book your first lesson today.",
  keywords: ["driving school", "driving lessons", "learn to drive", "UK", "DVSA approved"],
  openGraph: {
    title: "AutoPilot Driving School",
    description: "Learn to Drive with Autopilot — UK's Premier Driving School",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "'Metropolis', 'DM Sans', sans-serif",
                borderRadius: "12px",
              },
              success: {
                iconTheme: { primary: "#E8200A", secondary: "#FFFFFF" },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
