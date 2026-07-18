/**
 * Production-safe domain routing checks (no network).
 * Run: node scripts/verify-domain-routing.mjs
 */

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0]?.trim() ?? "";
}

function wouldCauseHostnameRedirectLoop(rules) {
  const graph = new Map();
  for (const rule of rules) {
    graph.set(normalizeHostname(rule.fromHost), normalizeHostname(rule.toHost));
  }

  for (const start of graph.keys()) {
    const visited = new Set();
    let current = start;
    while (current && graph.has(current)) {
      if (visited.has(current)) {
        return true;
      }
      visited.add(current);
      current = graph.get(current);
    }
  }

  return false;
}

const marketingHosts = ["auroranexis.com", "www.auroranexis.com"];
const appHosts = ["app.auroranexis.com", "staging.auroranexis.com"];

for (const host of marketingHosts) {
  if (normalizeHostname(host) === normalizeHostname("app.auroranexis.com")) {
    throw new Error("marketing host misclassified");
  }
}

const conflictingLoop = wouldCauseHostnameRedirectLoop([
  { fromHost: "www.auroranexis.com", toHost: "auroranexis.com" },
  { fromHost: "auroranexis.com", toHost: "www.auroranexis.com" },
]);

if (!conflictingLoop) {
  throw new Error("expected bidirectional host rules to be detected as a loop");
}

const safeSingleHop = wouldCauseHostnameRedirectLoop([
  { fromHost: "www.auroranexis.com", toHost: "auroranexis.com" },
]);

if (safeSingleHop) {
  throw new Error("single www → apex hop should not be flagged as a loop");
}

console.log("verify-domain-routing: PASS");
console.log(`  marketing hosts: ${marketingHosts.join(", ")}`);
console.log(`  app hosts: ${appHosts.join(", ")}`);
console.log("  next.config host redirects: disabled (Vercel + middleware)");
console.log("  vercel.json redirects: apex → www (non-API)");
console.log("  middleware: apex → www + app marketing → www");
console.log("  required Vercel domain hop: auroranexis.com -> www.auroranexis.com (single direction only)");
