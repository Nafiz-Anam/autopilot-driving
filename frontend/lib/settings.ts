import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  STRIPE_SECRET_KEY: "stripe_secret_key",
  STRIPE_PUBLISHABLE_KEY: "stripe_publishable_key",
  STRIPE_WEBHOOK_SECRET: "stripe_webhook_secret",
  SMTP_HOST: "smtp_host",
  SMTP_PORT: "smtp_port",
  SMTP_USER: "smtp_user",
  SMTP_PASS: "smtp_pass",
  EMAIL_FROM: "email_from",
  EMAIL_ADMIN: "email_admin",
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
  return dbKey ?? "";
}

export async function getStripePublishableKey(): Promise<string> {
  const dbKey = await getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY);
  return dbKey ?? "";
}

export async function getStripeWebhookSecret(): Promise<string> {
  const dbKey = await getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET);
  return dbKey ?? "";
}

export async function getAllStripeSettings() {
  const [secretKey, publishableKey, webhookSecret] = await Promise.all([
    getSetting(SETTING_KEYS.STRIPE_SECRET_KEY),
    getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY),
    getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET),
  ]);

  return {
    stripe_secret_key: secretKey ?? "",
    stripe_publishable_key: publishableKey ?? "",
    stripe_webhook_secret: webhookSecret ?? "",
  };
}

export async function getSmtpSettings() {
  const [host, port, user, pass, emailFrom, emailAdmin] = await Promise.all([
    getSetting(SETTING_KEYS.SMTP_HOST),
    getSetting(SETTING_KEYS.SMTP_PORT),
    getSetting(SETTING_KEYS.SMTP_USER),
    getSetting(SETTING_KEYS.SMTP_PASS),
    getSetting(SETTING_KEYS.EMAIL_FROM),
    getSetting(SETTING_KEYS.EMAIL_ADMIN),
  ]);

  const parsedPort = Number(port);

  return {
    smtp_host: host ?? "",
    smtp_port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587,
    smtp_user: user ?? "",
    smtp_pass: pass ?? "",
    email_from: emailFrom ?? "",
    email_admin: emailAdmin ?? "",
  };
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
