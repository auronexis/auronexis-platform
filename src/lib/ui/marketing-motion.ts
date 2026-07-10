/**
 * Marketing motion tokens — subtle enterprise animations.
 * Respects prefers-reduced-motion via globals.css html.reduce-motion rules.
 */

export const marketingMotionEnter = "motion-page-enter";

export const marketingCardHover =
  "transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const marketingSectionFade = "motion-empty-enter";

export const marketingLinkHover =
  "transition-colors duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:text-primary";

export const marketingCtaPress = "active:scale-[0.98] motion-reduce:active:scale-100";
