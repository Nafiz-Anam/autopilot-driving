import Stripe from "stripe";

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 30_000,
  });
}

export function isStripePublishableKey(value: string): boolean {
  return /^pk_(test|live)_/.test(value);
}

export function isStripeSecretKey(value: string): boolean {
  return /^sk_(test|live)_/.test(value);
}

export function isStripeWebhookSecret(value: string): boolean {
  return /^whsec_/.test(value);
}
