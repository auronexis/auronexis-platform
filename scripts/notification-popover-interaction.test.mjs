import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

/** Mirrors src/lib/notifications/popover-interaction.ts — no timers. */
function shouldKeepNotificationPopoverOpen(pointerOverTrigger, pointerOverPopup) {
  return pointerOverTrigger || pointerOverPopup;
}

test("notification popover stay-open policy treats trigger and popup as one zone", () => {
  assert.equal(shouldKeepNotificationPopoverOpen(true, false), true);
  assert.equal(shouldKeepNotificationPopoverOpen(false, true), true);
  assert.equal(shouldKeepNotificationPopoverOpen(true, true), true);
  assert.equal(shouldKeepNotificationPopoverOpen(false, false), false);

  const policy = readSource("src/lib/notifications/popover-interaction.ts");
  assert.match(policy, /return pointerOverTrigger \|\| pointerOverPopup/);
});

test("notification bell uses a padding bridge instead of a margin gap between trigger and panel", () => {
  const source = readSource("src/components/notifications/notification-bell-client.tsx");

  // Root owns enter/leave so trigger + popup are one zone.
  assert.match(source, /onMouseEnter=\{\(\) => setOpen\(true\)\}/);
  assert.match(source, /onMouseLeave=\{\(\) => setOpen\(false\)\}/);

  // Gap must be padding on the absolute bridge, not margin that creates a dead hit zone.
  assert.match(source, /absolute right-0 top-full z-50 w-80 pt-2/);
  assert.doesNotMatch(source, /mt-2 w-80/);
  assert.doesNotMatch(source, /top-full z-50 mt-2/);

  // Outside click + Escape remain deliberate close paths alongside leave-zone.
  assert.match(source, /mousedown/);
  assert.match(source, /Escape/);
  assert.match(source, /aria-expanded=\{open\}/);
  assert.match(source, /aria-controls=\{panelId\}/);
  assert.match(source, /onClick=\{\(\) => setOpen\(\(current\) => !current\)\}/);
});
