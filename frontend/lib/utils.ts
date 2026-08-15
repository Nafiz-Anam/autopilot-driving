import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(num);
}

/** Amount actually paid on a booking, after any coupon/voucher discount. */
export function paidAmount(totalAmount: number, discountAmount?: number | null): number {
  return Math.max(0, totalAmount - (discountAmount ?? 0));
}

/** Plain-text "amount paid" for contexts without JSX (CSV export, modal copy). */
export function formatPaidAmount(totalAmount: number, discountAmount?: number | null): string {
  const discount = discountAmount ?? 0;
  if (discount <= 0) return formatPrice(totalAmount);
  return `${formatPrice(paidAmount(totalAmount, discount))} (full price ${formatPrice(totalAmount)})`;
}

export function generateBookingReference(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "APS-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateVoucherCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getPostcodePrefix(postcode: string): string {
  const cleaned = postcode.toUpperCase().replace(/\s/g, "");
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2})/);
  return match ? match[1] : cleaned.slice(0, 3);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}hr ${mins}mins` : `${hours}hr`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
