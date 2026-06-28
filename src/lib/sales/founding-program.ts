export const FOUNDING_CUSTOMER_LIMIT = 10;
export const FOUNDING_CUSTOMER_DISCOUNT_PERCENT = 50;

export const FOUNDING_CUSTOMER_OFFER = {
  summary: "First 10 founding customers receive 50% beta pricing with lifetime discount lock-in.",
  benefits: [
    "50% beta pricing during pilot",
    "Lifetime discount on base subscription",
    "Founding customer badge",
    "Roadmap influence sessions",
    "Priority support queue",
  ],
  badgeLabel: "Founding Customer",
} as const;

export type FoundingProgramStatus = {
  limit: number;
  enrolled: number;
  remaining: number;
  isFull: boolean;
  discountPercent: number;
  lifetimeDiscount: boolean;
  badge: boolean;
  roadmapInfluence: boolean;
  prioritySupport: boolean;
};

export function buildFoundingProgramStatus(enrolled: number): FoundingProgramStatus {
  const remaining = Math.max(0, FOUNDING_CUSTOMER_LIMIT - enrolled);
  return {
    limit: FOUNDING_CUSTOMER_LIMIT,
    enrolled,
    remaining,
    isFull: enrolled >= FOUNDING_CUSTOMER_LIMIT,
    discountPercent: FOUNDING_CUSTOMER_DISCOUNT_PERCENT,
    lifetimeDiscount: true,
    badge: true,
    roadmapInfluence: true,
    prioritySupport: true,
  };
}
