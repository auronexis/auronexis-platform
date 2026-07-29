/**
 * Evidence that timezone-sensitive rendering produces different text for the same
 * logical moment — the class of mismatch that triggers React #418 on hydration.
 *
 * Behavioral SSR→hydrate with onRecoverableError is not feasible here: the repo
 * has no jsdom / Testing Library / Vitest DOM harness, and Node cannot hydrate
 * without a DOM. This harness proves the mismatch class; Production browser
 * verification confirms #418 is gone.
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
  // 22:30 UTC — evening on Vercel UTC, morning in Berlin, afternoon in LA.
  const instant = "2026-07-20T22:30:00.000Z";
  const utcHour = localHourInTimeZone(instant, "UTC");
  const berlinHour = localHourInTimeZone(instant, "Europe/Berlin");
  const laHour = localHourInTimeZone(instant, "America/Los_Angeles");

  assert.equal(utcHour, 22);
  assert.equal(berlinHour, 0);
  assert.equal(laHour, 15);

  const serverGreeting = greetingForLocalHour(utcHour);
  const berlinGreeting = greetingForLocalHour(berlinHour);
  const laGreeting = greetingForLocalHour(laHour);

  assert.equal(serverGreeting, "Good evening");
  assert.equal(berlinGreeting, "Good morning");
  assert.equal(laGreeting, "Good afternoon");

  // Pre-fix Executive Brief baked getTimeGreeting() into SSR HTML as:
  //   {brief.greeting}, {brief.firstName}.
  const serverHtml = `${serverGreeting}, Owner.`;
  const clientHtmlBerlin = `${berlinGreeting}, Owner.`;
  assert.notEqual(serverHtml, clientHtmlBerlin);
});

test("evidence: notification timestamps without explicit zone diverge across host timezones", () => {
  const instant = "2026-07-20T15:30:00.000Z";
  const utcText = formatDateTimeInZone(instant, "UTC");
  const berlinText = formatDateTimeInZone(instant, "Europe/Berlin");

  assert.notEqual(utcText, berlinText);

  // Pre-fix formatNotificationTimestamp called formatAppDateTime(value) with no
  // timeZone — Intl then used the runtime host zone (Vercel UTC vs browser local).
  const regional = readSource("src/lib/i18n/regional.ts");
  assert.match(regional, /DEFAULT_TIMEZONE = "UTC"/);
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

test("behavioral hydration DOM test is intentionally deferred", () => {
  // Documented constraint: package.json has no jsdom / @testing-library / vitest.
  // Adding a DOM harness solely for one test would be a new framework surface.
  // Production browser verification is the acceptance check for React #418 absence.
  const pkg = readSource("package.json");
  assert.doesNotMatch(pkg, /"jsdom"/);
  assert.doesNotMatch(pkg, /"@testing-library\/react"/);
  assert.doesNotMatch(pkg, /"vitest"/);
});
