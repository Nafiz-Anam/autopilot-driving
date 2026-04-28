"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  phone: z
    .string()
    .regex(
      /^(\+44|0)[\d\s]{9,12}$/,
      "Please enter a valid UK phone number"
    ),
  postcode: z
    .string()
    .regex(
      /^[A-Za-z]{1,2}\d{1,2}[A-Za-z]?\s?\d[A-Za-z]{2}$/,
      "Please enter a valid UK postcode"
    ),
  bestTime: z.string().min(1, "Please select a best time to call"),
});

type FormValues = z.infer<typeof schema>;

const timeOptions = [
  "Morning (8am – 12pm)",
  "Afternoon (12pm – 5pm)",
  "Evening (5pm – 8pm)",
  "Any time",
];

export function CallbackForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          postcode: data.postcode,
          enquiryType: "callback_request",
          callTime: data.bestTime,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "40px 24px",
          textAlign: "center" as const,
        }}
      >
        {/* Green tick */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#16A34A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0D0D0D", margin: 0 }}>
          We will call you soon!
        </p>
        <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>
          One of our team will be in touch during your preferred time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      {/* Name */}
      <div>
        <label htmlFor="cb-name" style={labelStyle}>
          Full name
        </label>
        <input
          id="cb-name"
          type="text"
          placeholder="Jane Smith"
          style={inputStyle(!!errors.name)}
          {...register("name")}
        />
        {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="cb-phone" style={labelStyle}>
          Phone number
        </label>
        <input
          id="cb-phone"
          type="tel"
          placeholder="07700 900 000"
          style={inputStyle(!!errors.phone)}
          {...register("phone")}
        />
        {errors.phone && <p style={errorStyle}>{errors.phone.message}</p>}
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="cb-postcode" style={labelStyle}>
          Postcode
        </label>
        <input
          id="cb-postcode"
          type="text"
          placeholder="SL1 1AA"
          style={inputStyle(!!errors.postcode)}
          {...register("postcode")}
        />
        {errors.postcode && <p style={errorStyle}>{errors.postcode.message}</p>}
      </div>

      {/* Best time */}
      <div>
        <label htmlFor="cb-best-time" style={labelStyle}>
          Best time to call
        </label>
        <select
          id="cb-best-time"
          style={{ ...inputStyle(!!errors.bestTime), appearance: "none" as const }}
          {...register("bestTime")}
          defaultValue=""
        >
          <option value="" disabled>
            Select a time...
          </option>
          {timeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.bestTime && <p style={errorStyle}>{errors.bestTime.message}</p>}
      </div>

      {/* Server error */}
      {serverError && (
        <p style={{ ...errorStyle, backgroundColor: "#FEF2F2", padding: "8px 12px", borderRadius: 8, margin: 0 }}>
          {serverError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          backgroundColor: isSubmitting ? "#F87171" : "#E8200A",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 15,
          padding: "14px 28px",
          borderRadius: 999,
          border: "none",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background-color 150ms ease",
        }}
      >
        {isSubmitting ? (
          <>
            <Spinner />
            Sending...
          </>
        ) : (
          "Request a Callback"
        )}
      </button>
    </form>
  );
}

// ── Inline spinner (no external dep) ─────────────────────────────────
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ── Shared style helpers ──────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#0D0D0D",
};

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    borderRadius: 10,
    border: `1.5px solid ${hasError ? "#E8200A" : "#D4D4D4"}`,
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0D0D0D",
    boxSizing: "border-box" as const,
  };
}

const errorStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#E8200A",
  fontWeight: 500,
};

export default CallbackForm;
