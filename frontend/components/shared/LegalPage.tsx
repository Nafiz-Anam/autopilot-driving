import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Section {
  heading: string;
  content: ReactNode;
}

interface LegalPageProps {
  badge: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
}

export function LegalPage({ badge, title, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <>
      {/* Hero */}
      <div className="bg-[#0D0D0D] pt-28 pb-16 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E8200A]/25 to-transparent" />
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#555] mb-6">
            <Link href="/" className="hover:text-[#FF5500] transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-[#888]">{title}</span>
          </nav>
          <p className="text-[#FF5500] uppercase tracking-widest text-xs font-semibold mb-3">
            {badge}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Moderniz', 'Barlow', sans-serif", letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          <p className="text-[#555] text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#444] text-base leading-relaxed mb-10 text-lg border-l-4 border-[#E8200A] pl-5">
            {intro}
          </p>

          <div className="space-y-10">
            {sections.map((s, i) => (
              <div key={i}>
                <h2 className="text-xl font-bold text-[#111] mb-3">
                  {i + 1}. {s.heading}
                </h2>
                <div className="text-[#444] text-base leading-relaxed space-y-3">{s.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-gray-200 text-sm text-[#888]">
            <p>
              If you have any questions about this page, please contact us at{" "}
              <a
                href="mailto:contact@autopilotdrivingschool.co.uk"
                className="text-[#E8200A] hover:underline"
              >
                contact@autopilotdrivingschool.co.uk
              </a>{" "}
              or call{" "}
              <a href="tel:07450556963" className="text-[#E8200A] hover:underline">
                07450 556 963
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
