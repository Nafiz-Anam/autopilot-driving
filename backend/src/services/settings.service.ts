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

const getStripeSecretKey = async (): Promise<string> =>
  (await getSetting(SETTING_KEYS.STRIPE_SECRET_KEY)) ?? '';
const getStripePublishableKey = async (): Promise<string> =>
  (await getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY)) ?? '';
const getStripeWebhookSecret = async (): Promise<string> =>
  (await getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET)) ?? '';

const getSmtpConfig = async (): Promise<{
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  adminEmail: string;
}> => {
  const [host, portRaw, user, pass, from, adminEmail] = await Promise.all([
    getSetting(SETTING_KEYS.SMTP_HOST),
    getSetting(SETTING_KEYS.SMTP_PORT),
    getSetting(SETTING_KEYS.SMTP_USER),
    getSetting(SETTING_KEYS.SMTP_PASS),
    getSetting(SETTING_KEYS.EMAIL_FROM),
    getSetting(SETTING_KEYS.EMAIL_ADMIN),
  ]);
  const port = Number(portRaw ?? '');
  return {
    host: host ?? '',
    port: Number.isFinite(port) && port > 0 ? port : 587,
    user: user ?? '',
    pass: pass ?? '',
    from: from ?? '',
    adminEmail: adminEmail ?? '',
  };
};

export default {
  getSetting,
  getStripeSecretKey,
  getStripePublishableKey,
  getStripeWebhookSecret,
  getSmtpConfig,
};
