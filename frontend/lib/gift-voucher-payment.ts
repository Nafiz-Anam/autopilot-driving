import type Stripe from "stripe";
import { addYears } from "date-fns";
import { prisma } from "@/lib/prisma";

/**
 * Creates the GiftVoucher row after successful payment. Idempotent per PaymentIntent id.
 */
export async function finalizeGiftVoucherPurchaseFromPayment(
  paymentIntent: Stripe.PaymentIntent
): Promise<{ code: string } | null> {
  const md = paymentIntent.metadata;
  if (md.type !== "gift_voucher" || !md.voucherCode) {
    return null;
  }

  const existing = await prisma.giftVoucher.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  });
  if (existing) {
    return { code: existing.code };
  }

  const amountGbp = parseFloat(md.amountGbp ?? "0");
  if (!Number.isFinite(amountGbp) || amountGbp < 10) {
    return null;
  }

  const row = await prisma.giftVoucher.create({
    data: {
      code: md.voucherCode,
      amount: amountGbp,
      balance: amountGbp,
      isRedeemed: false,
      senderName: md.senderName ?? "—",
      recipientName: md.recipientName ?? "—",
      recipientEmail: md.recipientEmail ?? "",
      message: md.message && md.message.length > 0 ? md.message : null,
      stripePaymentId: paymentIntent.id,
      expiresAt: addYears(new Date(), 1),
    },
  });

  return { code: row.code };
}
