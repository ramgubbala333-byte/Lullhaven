// Dormant RevenueCat layer for Rainhaven Plus.
//
// Rainhaven launches completely free: the owner's sequencing is build
// first, monetize later, so no purchase can happen in v1 and this file
// ships as an inert stub with the same shape as Mistless's. When the
// business structure is cleared and Plus turns on, the work is:
//   1. npx expo install react-native-purchases
//   2. Put the public RevenueCat SDK keys in app config and pass them
//      to configurePurchases() below.
//   3. Implement getOfferings / purchasePackage / getCustomerInfo
//      against the SDK, then point the paywall's price constants at
//      the live offerings.
// Pricing decided for when it turns on (v1.1, from the category
// review mining: users will pay once, and resent weekly tiers):
// lifetime $29.99 as the lead, optional annual $19.99, no monthly,
// no weekly tier; terms printed on the paywall itself. The
// grandfathering promise stands: core playback, the mixer, presets,
// the sleep timer, and everything free today stay free forever and
// must never be gated behind this layer.

export const PLUS_PRICES = {
  lifetime: 29.99,
  annual: 19.99,
} as const;

let configured = false;

export function configurePurchases(_apiKey?: string): void {
  // No-op in v1: purchases are deliberately not wired.
  configured = false;
}

export function isPurchasesConfigured(): boolean {
  return configured;
}

export async function getOfferings(): Promise<null> {
  return null;
}

export async function purchasePackage(_packageId: string): Promise<boolean> {
  return false;
}

export async function getCustomerInfo(): Promise<{ isPlus: boolean }> {
  return { isPlus: false };
}
