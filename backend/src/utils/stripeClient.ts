import Stripe from 'stripe';

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 30_000,
  });
}
