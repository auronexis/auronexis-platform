/**
 * Aurora motion system — CSS class fragments for consistent micro-interactions.
 * Durations: hover/dropdown/search/sidebar 150ms, dialog/toast 180ms. Max 200ms.
 */

import { focusRing, pressable } from "@/lib/ui/tokens";

export const easePremium = "ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

export const motionFast = "duration-150";
export const motionBase = "duration-[180ms]";

/** Dropdown / menu panel entrance */
export const motionDropdownEnter = "motion-dropdown-enter";

/** Modal / dialog panel entrance */
export const motionDialogEnter = "motion-dialog-enter";

/** Modal backdrop fade */
export const motionBackdropEnter = "motion-backdrop-enter";

/** Dashboard page content entrance */
export const motionPageEnter = "motion-page-enter";

/** Toast slide-in */
export const motionToastEnter = "motion-toast-enter";

/** Empty state fade-in */
export const motionEmptyEnter = "motion-empty-enter";

/** Interactive card lift + press */
export const cardInteractive =
  "cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg active:scale-[0.995]";

/** Aurora focus glow for inputs and search */
export const auroraInputFocus =
  "hover:border-border-strong focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)]";

/** Validation shake — apply when error prop is set */
export const inputErrorShake = "motion-input-shake";

/** Topbar icon button with subtle scale on hover */
export const topbarIconButton = [
  "inline-flex items-center justify-center rounded-md p-2 text-muted",
  "transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
  "hover:scale-105 hover:bg-muted/10 hover:text-foreground hover:shadow-xs",
  focusRing,
  pressable,
].join(" ");

/** Search result row highlight */
export const searchResultRow =
  "transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:bg-primary/[0.06] hover:shadow-xs focus-visible:bg-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export const searchResultRowActive = "bg-primary/[0.08] ring-1 ring-primary/20";
