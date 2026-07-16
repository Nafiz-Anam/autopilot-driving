"use client";

import { useRef, type ReactNode } from "react";
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

// Real Google reviews for Autopilot Driving School — https://share.google/9f1lVMtQtUGcm9ea7
const FALLBACK_TESTIMONIALS: CardProps[] = [
  {
    quote:
      "Shuhel conducted my mock test, so professional felt like the real thing. I actually failed my mock test the day before my test, with 4 majors but the feedback I was given helped me pass the real test the very next day!!! 100% recommend using if you have your test coming up!",
    name: "Aanayah",
    passed: "a month ago",
    initials: "A",
    accent: "#E8200A",
  },
  {
    quote:
      "I had a great experience learning to drive with my instructor Shuhel. They were patient, calm, and explained everything clearly, which really helped build my confidence on the road. Lessons were well-structured and tailored to my pace, and he was always friendly and supportive! I passed with confidence and would highly recommend them to anyone looking for a reliable and encouraging driving instructor.",
    name: "Sumaiya",
    passed: "6 months ago",
    initials: "S",
    accent: "#FF3A1A",
  },
  {
    quote:
      "I couldn't have asked for a better driving instructor. From my very first lesson, Suhel was patient and supportive. He always explained things clearly, helped build my confidence behind the wheel, and made every lesson enjoyable and productive. I would highly recommend Suhel. Thank you for all your help, guidance, and encouragement throughout my driving journey.",
    name: "Shahbaz Hussain",
    passed: "a month ago",
    initials: "SH",
    accent: "#FF5500",
  },
  {
    quote:
      "I took two mock driving tests before attending my final driving test. These mock tests helped me build confidence and identify areas where I needed improvement. Suhail carefully guided me through the test routes and provided one-to-one driving instruction, which greatly improved my confidence behind the wheel. Thank you, Suhail, for your outstanding service, guidance, and support.",
    name: "Kishore Reddy Malireddy",
    passed: "a month ago",
    initials: "KR",
    accent: "#E8200A",
  },
  {
    quote:
      "My driving instructor was honestly exceptional. Patient, calm, and always clear with explanations. Every lesson felt structured and focused, and he never made me feel stupid for getting things wrong. He built my confidence massively even when I had an instructor who messed up my sense of driving and taught me how to drive safely, not just pass a test. I couldn't have asked for better support. Highly recommend. Will be recommending!",
    name: "Rahiba S",
    passed: "a month ago",
    initials: "RS",
    accent: "#FF3A1A",
  },
  {
    quote:
      "I'm so grateful to have Shuhel bhai as my driving instructor. He is one of the most patient, hard working and motivating instructor. He lets you drive without worrying about his car and learn from your mistakes. Because of his constant support and guidance I was able to pass my driving test. I'll always be grateful for his hard work and support. I would highly recommend him to anyone looking for a reliable driving instructor.",
    name: "Naima Choudhury",
    passed: "6 months ago",
    initials: "NC",
    accent: "#FF5500",
  },
  {
    quote:
      "10/10 experience with Shuhel Bhai, honestly couldn't recommend him enough. He is so patient and teaches everything to such a high standard, definitely wouldn't have passed without him! He has made me into such a confident driver and has taught me everything that I need to know. Extremely happy that I had all my lessons with him and passed!",
    name: "Tanjilla Khan",
    passed: "7 months ago",
    initials: "TK",
    accent: "#FF3A1A",
  },
];

const REVIEW_LINKS = [
  {
    provider: "Google Reviews",
    href: "https://share.google/9f1lVMtQtUGcm9ea7",
    logo: (
      <svg width="22" height="22" viewBox="0 0 48 48" className="shrink-0">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.3-.1-2.7-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3c-7.5 0-14 4.1-17.7 10.2z"
        />
        <path
          fill="#4CAF50"
          d="M24 45c5.3 0 10.1-1.8 13.9-5l-6.4-5.4C29.3 36.7 26.8 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.9 40.9 16.4 45 24 45z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C39.9 37.1 43 31.4 43 24c0-1.3-.1-2.7-.4-3.5z"
        />
      </svg>
    ),
  },
  {
    provider: "Yell Reviews",
    href: "https://www.yell.com/biz/autopilot-driving-school-ilford-10654688/",
    logo: (
      <div className="w-[22px] h-[22px] rounded-md bg-black flex items-center justify-center shrink-0">
        <span className="text-[#FFE600] font-black text-[11px] leading-none">Y</span>
      </div>
    ),
  },
];

function ReviewBadge({
  provider,
  href,
  logo,
}: {
  provider: string;
  href: string;
  logo: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-brand-red/30 transition-all duration-200"
    >
      {logo}
      <div>
        <p className="text-xs font-bold text-brand-black leading-tight">{provider}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-semibold text-brand-black">5.0/5.0</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}

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
          className="flex flex-wrap items-end justify-between gap-6"
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
          <div className="flex flex-wrap gap-3">
            {REVIEW_LINKS.map((r) => (
              <ReviewBadge key={r.provider} provider={r.provider} href={r.href} logo={r.logo} />
            ))}
          </div>
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
