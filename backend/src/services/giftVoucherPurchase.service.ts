import prisma from '../client';
import settingsService from './settings.service';
import { createStripeClient } from '../utils/stripeClient';
import { generateVoucherCode } from '../utils/voucherCode';

const META_MAX = 450;

type Body = {
  amount: number;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  message?: string;
};

async function createPaymentIntent(input: Body) {
  const amountPence = Math.round(input.amount * 100);

  let code = generateVoucherCode();
  let attempt = 0;
  while (attempt < 12) {
    const ex = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "GiftVoucher" WHERE code = $1 LIMIT 1`,
      code
    );
    if (!ex.length) break;
    code = generateVoucherCode();
    attempt += 1;
  }
  if (attempt >= 12) {
    return { error: 'SERVER' as const, message: 'Could not allocate voucher code' };
  }

  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway not configured. Contact support.' };
  }

  const stripe = createStripeClient(secretKey);
  const msg = (input.message ?? '').slice(0, META_MAX);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: {
      type: 'gift_voucher',
      voucherCode: code,
      amountGbp: input.amount.toFixed(2),
      senderName: input.senderName.slice(0, 80),
      senderEmail: input.senderEmail.slice(0, 120),
      recipientName: input.recipientName.slice(0, 80),
      recipientEmail: input.recipientEmail.slice(0, 120),
      message: msg,
    },
  });

  return {
    success: true as const,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      code,
    },
  };
}

async function confirmFromPaymentIntent(paymentIntentId: string) {
  const secretKey = await settingsService.getStripeSecretKey();
  if (!secretKey) {
    return { error: 'SERVICE_UNAVAILABLE' as const, message: 'Payment gateway not configured.' };
  }

  const stripe = createStripeClient(secretKey);
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata.type !== 'gift_voucher') {
    return { error: 'BAD_REQUEST' as const, message: 'Invalid payment type' };
  }

  if (paymentIntent.status !== 'succeeded') {
    return {
      success: true as const,
      data: { status: paymentIntent.status, code: null as string | null },
    };
  }

  const paymentFinalizeService = await import('./paymentFinalize.service');
  const result = await paymentFinalizeService.default.finalizeGiftVoucherPurchaseFromPayment(paymentIntent);

  return {
    success: true as const,
    data: {
      status: paymentIntent.status,
      code: result?.code ?? paymentIntent.metadata.voucherCode ?? null,
    },
  };
}

export default { createPaymentIntent, confirmFromPaymentIntent };
