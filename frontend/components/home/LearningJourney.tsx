"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, CalendarDays, BookOpen, CheckCircle2 } from "lucide-react";

// ─── Coordinate system ────────────────────────────────────────────────────────
// SVG viewBox: 0 0 512 820
// Container:   max-w-[512px] w-full, height auto via aspect-ratio: 512/820
// Because the container aspect-ratio matches the viewBox, scale is always
// uniform (no letterboxing) → CSS % positions and SVG coordinates stay in sync.
//
// Road swings: x = 90 (far LEFT) ↔ x = 422 (far RIGHT)
// Node positions:
//   Step 1  x=90,  y=160  → side=right  (road on left,  card on right)
//   Step 2  x=422, y=360  → side=left   (road on right, card on left)
//   Step 3  x=90,  y=540  → side=right
//   Step 4  x=422, y=710  → side=left
// ─────────────────────────────────────────────────────────────────────────────

const VW = 512;
const VH = 820;

interface Node { x: number; y: number; side: "right" | "left" }
const NODES: Node[] = [
  { x: 90,  y: 160, side: "right" },
  { x: 422, y: 360, side: "left"  },
  { x: 90,  y: 540, side: "right" },
  { x: 422, y: 710, side: "left"  },
];

// Winding road path — starts centre-top, swings to each node, returns centre-bottom
const ROAD = [
  `M ${VW / 2},0`,
  `C 90,60  90,100  90,160`,
  `C 90,230 422,290 422,360`,
  `C 422,430 90,480 90,540`,
  `C 90,610 422,660 422,710`,
  `C 422,770 ${VW / 2},810 ${VW / 2},${VH}`,
].join(" ");

// Connector line x-coords (where the line meets the card edge)
const CARD_EDGE_PCT = 0.37; // 37% from relevant edge
const CARD_EDGE_PX  = Math.round(VW * CARD_EDGE_PCT); // 189px

const steps = [
  {
    n: "01", Icon: FileText,
    title: "Apply for Provisional Licence",
    desc:  "Register with the DVLA online in 5 minutes — your first step on the road.",
    grad:  "linear-gradient(135deg,#E8200A,#CC1A08)",
  },
  {
    n: "02", Icon: CalendarDays,
    title: "Book Lessons with Autopilot",
    desc:  "Browse DVSA-approved instructors near you and book your first lesson instantly.",
    grad:  "linear-gradient(135deg,#EF2A0F,#FF3A1A)",
  },
  {
    n: "03", Icon: BookOpen,
    title: "Pass Your Theory Test",
    desc:  "Ace it with our free mock tests, hazard perception videos, and expert guidance.",
    grad:  "linear-gradient(135deg,#FF3A1A,#FF5500)",
  },
  {
    n: "04", Icon: CheckCircle2,
    title: "Pass Your Practical Test",
    desc:  "Drive with confidence and collect your full UK driving licence.",
    grad:  "linear-gradient(135deg,#FF5500,#FF6A00)",
  },
];

export function LearningJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-white py-14 sm:py-20 lg:py-28 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto" ref={ref}>

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[#E8200A] uppercase tracking-widest text-xs font-semibold mb-3">
            Step by Step
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D0D0D]"
            style={{ fontFamily: "'Moderniz','Barlow',sans-serif", letterSpacing: "-0.02em" }}
          >
            Your Road to Passing
          </h2>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════
            ROAD SCENE  (sm +)
            Container: 512 × 820 coordinate space.
            SVG viewBox matches → CSS % ↔ SVG units stay perfectly in sync.
            Cards positioned with the same percentages as SVG nodes.
        ════════════════════════════════════════════════════════════ */}
        <div className="hidden sm:block">
          <div
            className="relative w-full max-w-[512px] mx-auto"
            style={{ aspectRatio: `${VW} / ${VH}` }}
          >
            {/* ── Road SVG ── */}
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="lj-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8200A" />
                  <stop offset="100%" stopColor="#FF5500" />
                </linearGradient>
              </defs>

              {/* Road: shadow → surface → highlight → centre dashes */}
              <path d={ROAD} stroke="#080808" strokeWidth="72" fill="none" strokeLinecap="round" />
              <path d={ROAD} stroke="#1C1917" strokeWidth="62" fill="none" strokeLinecap="round" />
              <path d={ROAD} stroke="#252220" strokeWidth="46" fill="none" strokeLinecap="round" />
              <path d={ROAD} stroke="white"   strokeWidth="3.5" fill="none"
                    strokeDasharray="22 16" strokeLinecap="round" opacity="0.65" />

              {/* Connector dashes: node → card edge */}
              {NODES.map((nd, i) => {
                const x2 = nd.side === "right" ? CARD_EDGE_PX : VW - CARD_EDGE_PX;
                return (
                  <line
                    key={i}
                    x1={nd.x} y1={nd.y}
                    x2={x2}   y2={nd.y}
                    stroke="#E8200A" strokeWidth="1.5"
                    strokeDasharray="5 5" opacity="0.4"
                  />
                );
              })}

              {/* Node dots */}
              {NODES.map((nd, i) => (
                <g key={i}>
                  <circle cx={nd.x} cy={nd.y} r="16" fill="white" />
                  <circle cx={nd.x} cy={nd.y} r="9"  fill="url(#lj-g)" />
                </g>
              ))}
            </svg>

            {/* ── Step cards ──
                top %  = node.y / VH × 100   (mirrors SVG y coordinate)
                left/right % = CARD_EDGE_PCT  (mirrors CARD_EDGE_PX / VW)
            ── */}
            {NODES.map((nd, i) => {
              const step    = steps[i];
              const topPct  = `${((nd.y / VH) * 100).toFixed(2)}%`;
              const isRight = nd.side === "right";

              const pos: React.CSSProperties = {
                position: "absolute",
                top: topPct,
                transform: "translateY(-50%)",
                ...(isRight
                  ? { left: `${CARD_EDGE_PCT * 100}%`, right: "1%" }
                  : { left: "1%", right: `${CARD_EDGE_PCT * 100}%` }),
              };

              return (
                <motion.div
                  key={step.n}
                  style={pos}
                  initial={{ opacity: 0, x: isRight ? 20 : -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="bg-white rounded-2xl p-4 sm:p-5"
                    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)" }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                        style={{ background: step.grad }}
                      >
                        {step.n}
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#FFF0EE,#FFE4E0)" }}
                      >
                        <step.Icon size={14} className="text-[#E8200A]" />
                      </div>
                    </div>
                    <h3 className="font-bold text-[#0D0D0D] text-sm leading-snug mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-[#6B6B6B] text-[11px] sm:text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            MOBILE  (< sm): vertical timeline
        ════════════════════════════════════════════════════════════ */}
        <div className="sm:hidden relative pl-12">
          <div
            className="absolute left-[1.05rem] top-2 bottom-2 w-0.5 rounded-full"
            style={{ background: "linear-gradient(to bottom,#E8200A,#FF6A00)" }}
          />
          <div className="space-y-7">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                className="relative"
                initial={{ opacity: 0, x: -16 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.1 }}
              >
                <div
                  className="absolute flex items-center justify-center text-white text-[11px] font-black border-2 border-white rounded-full"
                  style={{
                    background: step.grad, width: 32, height: 32,
                    left: -44, top: "50%", transform: "translateY(-50%)",
                  }}
                >
                  {step.n}
                </div>
                <div
                  className="bg-white rounded-2xl p-4 border border-[#F0F0F0]"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#FFF0EE,#FFE4E0)" }}
                    >
                      <step.Icon size={15} className="text-[#E8200A]" />
                    </div>
                    <h3 className="font-bold text-[#0D0D0D] text-sm leading-snug">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[#6B6B6B] text-xs leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
