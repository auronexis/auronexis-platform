/**
 * Shared design-system class fragments.
 * Prefer semantic tokens from globals.css over hardcoded palette utilities.
 */

/** Standard interactive transition — 150ms, Stripe-like. */
export const transitionInteractive = "transition-all duration-150 ease-out";

/** Unified focus ring for keyboard navigation. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Subtle press feedback for buttons and icon controls. */
export const pressable = "active:scale-[0.98]";

/** Text link styling for inline navigation. */
export const linkText =
  "font-medium text-primary underline-offset-4 transition-colors duration-150 hover:text-primary-hover hover:underline";

/** Muted inline link — sidebar, secondary navigation. */
export const linkMuted =
  "text-muted transition-colors duration-150 hover:text-foreground";

/** Icon button / menu trigger surface. */
export const iconButtonSurface = [
  "inline-flex cursor-pointer items-center justify-center rounded-md p-2 text-muted",
  transitionInteractive,
  "hover:bg-muted/10 hover:text-foreground hover:shadow-xs",
  focusRing,
  pressable,
].join(" ");

/** Sidebar nav item base — dark sidebar surface. */
export const sidebarNavItem = [
  "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium",
  transitionInteractive,
  focusRing,
].join(" ");

/** Table row with clickable content. */
export const tableRowInteractive = [
  transitionInteractive,
  "hover:bg-muted/5",
  "has-[a]:cursor-pointer has-[button]:cursor-pointer",
].join(" ");

/** Section vertical rhythm inside pages. */
export const pageSection = "space-y-6";

/** Page content max width wrapper. */
export const pageContainer = "mx-auto w-full max-w-7xl space-y-8";

/** Filter tab links for archive/active list views. */
export const filterTabActive =
  "text-sm font-semibold text-foreground underline-offset-4 hover:text-primary";

export const filterTabInactive =
  "text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground";

/** Sidebar nav scroll region — invisible scrollbar, flex child scroll. */
export const sidebarNavScroll = "min-h-0 flex-1 overflow-y-auto no-scrollbar";

/**
 * Sticky side rail inside #main-content scroll region (lg+ detail layouts).
 * Position only — never combine max-height/overflow on this element (causes false scrollbars).
 */
export const dashboardStickyRail = "min-w-0 self-start lg:sticky lg:top-8";

/**
 * Inner wrapper for detail metadata rails.
 * max-height caps tall content; overflow-y-auto only activates when content exceeds the cap.
 * 6rem = topbar (4rem) + sticky inset (top-8 / 2rem) inside the main scrollport.
 */
export const dashboardStickyRailScrollCap =
  "min-h-0 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:overscroll-contain";

/** Sticky side rail for xl+ dashboard grids (reports assistant, dashboard asides). */
export const dashboardStickyRailWide = "min-w-0 self-start xl:sticky xl:top-8";

/** Inner scroll cap for xl+ dashboard asides — same rules as detail rails. */
export const dashboardStickyRailWideScrollCap =
  "min-h-0 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto xl:overscroll-contain";
