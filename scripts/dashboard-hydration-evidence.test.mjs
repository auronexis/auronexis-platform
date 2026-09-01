/**
 * Evidence that timezone-sensitive rendering produces different text for the same
 * logical moment — the class of mismatch that triggers React #418 on hydration.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function greetingForLocalHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function localHourInTimeZone(iso, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  return Number(parts.find((part) => part.type === "hour")?.value ?? "0");
}

function formatDateTimeInZone(iso, timeZone) {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${datePart}, ${timePart}`;
}

test("evidence: time-of-day greeting diverges across timezones for the same UTC instant", () => {
  const instant = "2026-07-20T22:30:00.000Z";
  const utcHour = localHourInTimeZone(instant, "UTC");
  const berlinHour = localHourInTimeZone(instant, "Europe/Berlin");

  assert.equal(utcHour, 22);
  assert.equal(berlinHour, 0);

  const serverGreeting = greetingForLocalHour(utcHour);
  const berlinGreeting = greetingForLocalHour(berlinHour);

  assert.equal(serverGreeting, "Good evening");
  assert.equal(berlinGreeting, "Good morning");
  assert.notEqual(`${serverGreeting}, Owner.`, `${berlinGreeting}, Owner.`);
});

test("evidence: notification timestamps without explicit zone diverge across host timezones", () => {
  const instant = "2026-07-20T15:30:00.000Z";
  const utcText = formatDateTimeInZone(instant, "UTC");
  const berlinText = formatDateTimeInZone(instant, "Europe/Berlin");

  assert.notEqual(utcText, berlinText);
});

test("evidence: stable SSR greeting omits time-of-day until client mount", () => {
  const greeting = readSource("src/components/dashboard/time-of-day-greeting.tsx");
  const recommendations = readSource("src/lib/intelligence/recommendations.ts");
  const types = readSource("src/lib/intelligence/types.ts");

  assert.doesNotMatch(recommendations, /getTimeGreeting/);
  assert.doesNotMatch(types, /greeting\s*:/);
  assert.match(greeting, /useState<string \| null>\(null\)/);
  assert.match(
    greeting,
    /greeting \? `\$\{greeting\}, \$\{firstName\}\$\{trailing\}` : firstName/,
  );
});

test("evidence: notification bell pre-formats timestamps before client hydration", () => {
  const bell = readSource("src/components/notifications/notification-bell.tsx");
  const list = readSource("src/components/notifications/notification-list.tsx");

  assert.match(bell, /toNotificationViews/);
  assert.doesNotMatch(list, /formatNotificationTimestamp/);
  assert.match(list, /formattedCreatedAt/);
});
