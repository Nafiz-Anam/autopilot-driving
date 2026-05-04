import type { Metadata } from "next";
import { Suspense } from "react";
import GiftVoucherPageClient from "./GiftVoucherPageClient";

export const metadata: Metadata = {
  title: "Gift Vouchers | AutoPilot",
  description: "Purchase a driving lesson gift voucher — secure payment with Stripe.",
};

export default function GiftVoucherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-surface" aria-hidden />}>
      <GiftVoucherPageClient />
    </Suspense>
  );
}
