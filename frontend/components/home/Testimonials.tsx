"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
// TODO: re-enable dynamic import once a valid Google Place ID is configured
// import { backendApiUrl } from "@/lib/backend-api";

interface ReviewData {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
}

interface CardProps {
  quote: string;
  name: string;
  passed: string;
  initials: string;
  accent: string;
  photoUrl?: string | null;
}

const ACCENT_COLORS = ["#E8200A", "#FF3A1A", "#FF5500"];

const FALLBACK_TESTIMONIALS: CardProps[] = [
  {
    quote:
      "Passed first time! My instructor was incredibly patient and professional. The booking system made everything so easy.",
    name: "Sarah Mitchell",
    passed: "March 2025",
    initials: "SM",
    accent: "#E8200A",
  },
  {
    quote:
      "I was nervous about driving but my instructor from Autopilot completely put me at ease. Couldn't recommend more highly.",
    name: "James O'Connor",
    passed: "January 2025",
    initials: "JO",
    accent: "#FF3A1A",
  },
  {
    quote:
      "The intensive course was brilliant — passed my test in just 2 weeks. Great value for money too.",
    name: "Priya Patel",
    passed: "February 2025",
    initials: "PP",
    accent: "#FF5500",
  },
  {
    quote:
      "As someone who had failed twice before, Autopilot gave me the confidence I needed. Passed with only 2 minors!",
    name: "Daniel Thompson",
    passed: "April 2025",
    initials: "DT",
    accent: "#E8200A",
  },
  {
    quote:
      "Excellent female instructor who made me feel completely comfortable. Passed first time after just 25 hours.",
    name: "Aisha Rahman",
    passed: "March 2025",
    initials: "AR",
    accent: "#FF5500",
  },
  {
    quote:
      "From zero driving experience to passing in 6 weeks. The structured lessons and progress tracking made all the difference.",
    name: "Thomas Brennan",
    passed: "May 2025",
    initials: "TB",
    accent: "#FF3A1A",
  },
  {
    quote:
      "Booked online in 2 minutes, got a brilliant instructor, passed first time. Autopilot makes the whole process effortless.",
    name: "Leila Hassan",
    passed: "April 2025",
    initials: "LH",
    accent: "#E8200A",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function mapReviewToCard(review: ReviewData, index: number): CardProps {
  return {
    quote: review.text,
    name: review.authorName,
    passed: review.relativeTime,
    initials: getInitials(review.authorName),
    accent: ACCENT_COLORS[index % ACCENT_COLORS.length],
    photoUrl: review.authorPhotoUrl,
  };
}

function TestimonialCard({ quote, name, passed, initials, accent, photoUrl }: CardProps) {
  return (
    <div
      className="flex-none w-[300px] sm:w-[340px] bg-[#F8F7F5] rounded-3xl p-6 relative select-none"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Stars */}
        <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, j) => (
            <Star key={j} size={13} className="fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-brand-dark-surface text-sm leading-relaxed mb-5 font-medium flex-1">
          &ldquo;{quote}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#EBEBEB]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}BB 100%)`,
                boxShadow: `0 4px 10px ${accent}30`,
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="font-bold text-brand-black text-sm leading-tight">{name}</p>
            <p className="text-[#9A9A9A] text-xs mt-0.5">{passed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Marquee row ────────────────────────────────────────────── */
function MarqueeRow({
  items,
  direction,
  speed,
}: {
  items: CardProps[];
  direction: "left" | "right";
  speed: number;
}) {
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden"
      style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}
    >
      <div
        className="flex gap-5 py-2"
        style={{
          width: "max-content",
          animation: `marquee-${direction} ${speed}s linear infinite`,
          willChange: "transform",
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────── */
export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  // TODO: replace static data with live Google reviews once Place ID is confirmed working
  // const [testimonials, setTestimonials] = useState<CardProps[]>(FALLBACK_TESTIMONIALS);
  // const [rating, setRating] = useState<number | null>(null);
  // const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const testimonials = FALLBACK_TESTIMONIALS;

  // TODO: re-enable once Google Place ID issue is resolved — fetches live reviews + rating
  // useEffect(() => {
  //   fetch(backendApiUrl("/public/reviews"))
  //     .then((res) => res.json())
  //     .then((json) => {
  //       if (json.success && json.data.reviews?.length > 0) {
  //         setTestimonials(json.data.reviews.map(mapReviewToCard));
  //         setRating(json.data.rating);
  //         setTotalReviews(json.data.totalReviews);
  //       }
  //     })
  //     .catch(() => {
  //       // silently fall back to hardcoded testimonials
  //     });
  // }, []);

  const row2 = [...testimonials].reverse();

  return (
    <section className="bg-white py-14 sm:py-20 lg:py-28 overflow-hidden">
      {/* Header — padded */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14" ref={ref}>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-brand-red uppercase tracking-widest text-xs font-semibold mb-3"
        >
          Student Stories
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-end gap-4"
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-black"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            What Our Students Say
          </h2>
        </motion.div>
      </div>

      {/* Row 1 — scrolls left */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-5"
      >
        <MarqueeRow items={testimonials} direction="left" speed={38} />
      </motion.div>

      {/* Row 2 — scrolls right (reversed order for variety) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.32 }}
      >
        <MarqueeRow items={row2} direction="right" speed={44} />
      </motion.div>
    </section>
  );
}
