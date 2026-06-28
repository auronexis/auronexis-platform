#!/usr/bin/env node
/**
 * Pilot environment bootstrap — creates demo + persona orgs and pilot RBAC accounts.
 * Usage: node scripts/seed-pilot-environment.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Optional: PILOT_SEED_PASSWORD (default: PilotDemo2025!)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.PILOT_SEED_PASSWORD ?? "PilotDemo2025!";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_ORG = { name: "Aurora Demo", slug: "aurora-demo" };

const PERSONA_ORGS = [
  { name: "Acme Automation", slug: "acme-automation" },
  { name: "Vertex MSP", slug: "vertex-msp" },
  { name: "Bluewave Consulting", slug: "bluewave-consulting" },
  { name: "NovaOps", slug: "novaops" },
  { name: "CyberFlow", slug: "cyberflow" },
];

const PILOT_ACCOUNTS = [
  { email: "demo@auroranexis.com", fullName: "Aurora Demo Owner", role: "owner", orgSlug: "aurora-demo" },
  { email: "pilot-owner@auroranexis.com", fullName: "Pilot Admin", role: "admin", orgSlug: "aurora-demo" },
  { email: "pilot-operator@auroranexis.com", fullName: "Pilot Operator", role: "staff", orgSlug: "aurora-demo" },
  { email: "pilot-viewer@auroranexis.com", fullName: "Pilot Viewer", role: "viewer", orgSlug: "aurora-demo" },
];

async function findOrgBySlug(slug) {
  const { data } = await admin.from("organizations").select("*").eq("slug", slug).maybeSingle();
  return data;
}

async function findUserByEmail(email) {
  const { data } = await admin.from("users").select("*").eq("email", email).maybeSingle();
  return data;
}

async function ensureOrg({ name, slug }) {
  const existing = await findOrgBySlug(slug);
  if (existing) {
    if (slug === DEMO_ORG.slug && existing.plan !== "enterprise") {
      await admin.from("organizations").update({ plan: "enterprise" }).eq("id", existing.id);
      console.log(`  upgraded plan: ${slug} → enterprise`);
    } else {
      console.log(`  org exists: ${slug}`);
    }
    return existing;
  }

  const { data, error } = await admin
    .from("organizations")
    .insert({ name, slug, plan: slug === DEMO_ORG.slug ? "enterprise" : "free" })
    .select("*")
    .single();

  if (error) throw new Error(`Org ${slug}: ${error.message}`);
  console.log(`  created org: ${slug}`);
  return data;
}

async function ensureUser({ email, fullName, role, orgId }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    console.log(`  user exists: ${email} (${existing.role})`);
    return existing;
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    throw new Error(`Auth ${email}: ${authError?.message ?? "unknown"}`);
  }

  const { error: profileError } = await admin.from("users").insert({
    auth_user_id: authData.user.id,
    organization_id: orgId,
    full_name: fullName,
    email,
    role,
    is_disabled: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Profile ${email}: ${profileError.message}`);
  }

  console.log(`  created user: ${email} (${role})`);
  return { email, role };
}

async function ensureEnterpriseSubscription(orgId) {
  const priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;
  if (!priceId) {
    console.warn("  skip subscription: STRIPE_ENTERPRISE_PRICE_ID not set");
    return;
  }

  const { error } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: orgId,
      stripe_customer_id: "cus_demo_pilot",
      stripe_subscription_id: "sub_demo_pilot",
      stripe_price_id: priceId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    throw new Error(`Subscription for demo org: ${error.message}`);
  }
  console.log("  enterprise subscription active for aurora-demo");
}

async function ensurePersonaOwner(org) {
  const email = `owner@${org.slug.replace(/-/g, "")}.demo`;
  return ensureUser({
    email,
    fullName: `${org.name} Owner`,
    role: "owner",
    orgId: org.id,
  });
}

async function main() {
  console.log("Seeding pilot environment...\n");

  const demoOrg = await ensureOrg(DEMO_ORG);

  for (const account of PILOT_ACCOUNTS) {
    await ensureUser({ ...account, orgId: demoOrg.id });
  }

  await ensureEnterpriseSubscription(demoOrg.id);

  for (const persona of PERSONA_ORGS) {
    const org = await ensureOrg(persona);
    await ensurePersonaOwner(org);
  }

  console.log("\nDone. Add to .env.local for E2E:");
  console.log(`E2E_EMAIL=demo@auroranexis.com`);
  console.log(`E2E_PASSWORD=${password}`);
  console.log("\nNext: run SQL seeds in Supabase SQL Editor:");
  console.log("  1. supabase/scripts/seed_demo_workspace.sql");
  console.log("  2. supabase/scripts/seed_demo_hardening.sql");
  console.log("  3. supabase/scripts/seed_persona_workspaces.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
