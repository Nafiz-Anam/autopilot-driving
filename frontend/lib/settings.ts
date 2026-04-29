import { prisma } from "@/lib/prisma";
import { env } from "@/env";

export const SETTING_KEYS = {
  STRIPE_SECRET_KEY: "stripe_secret_key",
  STRIPE_PUBLISHABLE_KEY: "stripe_publishable_key",
  STRIPE_WEBHOOK_SECRET: "stripe_webhook_secret",
} as const;

async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}

export async function getStripeSecretKey(): Promise<string> {
  const dbKey = await getSetting(SETTING_KEYS.STRIPE_SECRET_KEY);
  return dbKey || env.STRIPE_SECRET_KEY;
}

export async function getStripePublishableKey(): Promise<string> {
  const dbKey = await getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY);
  return dbKey || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const dbKey = await getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET);
  return dbKey || env.STRIPE_WEBHOOK_SECRET;
}

export async function getAllStripeSettings() {
  const [secretKey, publishableKey, webhookSecret] = await Promise.all([
    getSetting(SETTING_KEYS.STRIPE_SECRET_KEY),
    getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY),
    getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET),
  ]);

  return {
    stripe_secret_key: secretKey ?? env.STRIPE_SECRET_KEY,
    stripe_publishable_key: publishableKey ?? env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripe_webhook_secret: webhookSecret ?? env.STRIPE_WEBHOOK_SECRET,
  };
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
