"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, Car, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, formatPrice } from "@/lib/utils";
import type { InstructorPublic } from "@/types";

interface InstructorCardProps {
  instructor: InstructorPublic;
  selected?: boolean;
  onSelect?: () => void;
  showBookButton?: boolean;
}

function AvailabilityDot({ availability }: { availability: "high" | "medium" | "low" }) {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full flex-shrink-0",
        availability === "high" && "bg-green-500",
        availability === "medium" && "bg-amber-400",
        availability === "low" && "bg-red-500"
      )}
    />
  );
}

function getAvailabilityLabel(availability: "high" | "medium" | "low"): string {
  if (availability === "high") return "High availability";
  if (availability === "medium") return "Limited slots";
  return "Few slots left";
}

function deriveAvailability(instructor: InstructorPublic): "high" | "medium" | "low" {
  // Placeholder heuristic based on rating / area count; real logic would query slots
  if (instructor.areas.length >= 3) return "high";
  if (instructor.areas.length === 2) return "medium";
  return "low";
}

export function InstructorCard({
  instructor,
  selected = false,
  onSelect,
  showBookButton = true,
}: InstructorCardProps) {
  const name = instructor.user.name;
  const initials = getInitials(name);
  const photoUrl = instructor.user.image ?? instructor.photoUrl;
  const availability = deriveAvailability(instructor);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onSelect();
            }
          : undefined
      }
      className={cn(
        "relative bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-colors duration-200",
        selected
          ? "border-2 border-brand-red shadow-lg"
          : "border-brand-border shadow-sm",
        onSelect && "cursor-pointer"
      )}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Avatar + Name row */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl select-none"
              style={{
                background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
              }}
            >
              {initials}
            </div>
          )}
          {/* Availability dot overlay */}
          <span
            className={cn(
              "absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
              availability === "high" && "bg-green-500",
              availability === "medium" && "bg-amber-400",
              availability === "low" && "bg-red-500"
            )}
          />
        </div>

        {/* Name + rating */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-black text-base leading-tight truncate">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= Math.round(instructor.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200 fill-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-brand-black">
              {instructor.rating.toFixed(1)}
            </span>
            <span className="text-xs text-brand-muted">
              ({instructor.reviewCount})
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            {instructor.yearsExp} {instructor.yearsExp === 1 ? "yr" : "yrs"} experience
          </p>
        </div>
      </div>

      {/* Transmission badges */}
      <div className="flex flex-wrap gap-2">
        {instructor.transmission.map((t) => (
          <span
            key={t}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              t.toLowerCase() === "manual"
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            )}
          >
            <Car className="w-3 h-3" />
            {t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {/* Areas */}
      {instructor.areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {instructor.areas.slice(0, 4).map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1 text-xs text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full"
            >
              <MapPin className="w-3 h-3 text-brand-red" />
              {area}
            </span>
          ))}
          {instructor.areas.length > 4 && (
            <span className="text-xs text-brand-muted px-2 py-0.5">
              +{instructor.areas.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer: price + availability */}
      <div className="flex items-center justify-between pt-1 border-t border-brand-border mt-auto">
        <div>
          <span className="text-2xl font-extrabold text-brand-red">
            {formatPrice(instructor.pricePerHour)}
          </span>
          <span className="text-xs text-brand-muted ml-1">/ hr</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AvailabilityDot availability={availability} />
          <span className="text-xs text-brand-muted">{getAvailabilityLabel(availability)}</span>
        </div>
      </div>

      {/* Select / Book button */}
      {showBookButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={cn(
            "w-full py-2.5 rounded-full font-semibold text-sm transition-colors duration-200",
            selected
              ? "bg-brand-red text-white hover:bg-brand-orange"
              : "bg-brand-surface text-brand-black border border-brand-border hover:bg-brand-red hover:text-white hover:border-brand-red"
          )}
        >
          {selected ? "Selected" : "Select Instructor"}
        </button>
      )}
    </motion.div>
  );
}

export default InstructorCard;
