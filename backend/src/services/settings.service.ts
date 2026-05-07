import prisma from '../client';

/** Keys stored in `Setting` — mirror frontend `lib/settings.ts` */
export const SETTING_KEYS = {
  STRIPE_SECRET_KEY: 'stripe_secret_key',
  STRIPE_PUBLISHABLE_KEY: 'stripe_publishable_key',
  STRIPE_WEBHOOK_SECRET: 'stripe_webhook_secret',
  SMTP_HOST: 'smtp_host',
  SMTP_PORT: 'smtp_port',
  SMTP_USER: 'smtp_user',
  SMTP_PASS: 'smtp_pass',
  EMAIL_FROM: 'email_from',
  EMAIL_ADMIN: 'email_admin',
} as const;

async function getSetting(key: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
    `SELECT value FROM "Setting" WHERE key = $1 LIMIT 1`,
    key
  );
  return rows[0]?.value ?? null;
}

const getStripeSecretKey = async (): Promise<string> => (await getSetting(SETTING_KEYS.STRIPE_SECRET_KEY)) ?? '';
const getStripePublishableKey = async (): Promise<string> =>
  (await getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY)) ?? '';
const getStripeWebhookSecret = async (): Promise<string> =>
  (await getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET)) ?? '';

export default {
  getSetting,
  getStripeSecretKey,
  getStripePublishableKey,
  getStripeWebhookSecret,
};
