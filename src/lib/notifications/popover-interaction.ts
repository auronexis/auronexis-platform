/**
 * Notification popover pointer-zone policy.
 * Trigger and popup share one interactive region — leaving either while still
 * over the other must not close the panel.
 */
export function shouldKeepNotificationPopoverOpen(
  pointerOverTrigger: boolean,
  pointerOverPopup: boolean,
): boolean {
  return pointerOverTrigger || pointerOverPopup;
}
