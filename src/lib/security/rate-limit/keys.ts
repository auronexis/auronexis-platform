import { hashEmailForRateLimit } from "@/lib/security/rate-limit/hash";

export function authLoginEmailKey(email: string): string {
  return `auth:login:email:${hashEmailForRateLimit(email)}`;
}

export function authSignupEmailKey(email: string): string {
  return `auth:signup:email:${hashEmailForRateLimit(email)}`;
}

export function authPasswordResetCooldownEmailKey(email: string): string {
  return `auth:password-reset-cooldown:email:${hashEmailForRateLimit(email)}`;
}

export function authPasswordResetEmailKey(email: string): string {
  return `auth:password-reset:email:${hashEmailForRateLimit(email)}`;
}

export function authPortalLoginEmailKey(email: string): string {
  return `auth:portal-login:email:${hashEmailForRateLimit(email)}`;
}

export function authPublicFormEmailKey(route: string, email: string): string {
  const safeRoute = route.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 64) || "form";
  return `auth:public-form:${safeRoute}:email:${hashEmailForRateLimit(email)}`;
}

export function authLoginIpKey(ip: string): string {
  return `auth:login:ip:${ip}`;
}

export function authSignupIpKey(ip: string): string {
  return `auth:signup:ip:${ip}`;
}

export function authPasswordResetIpKey(ip: string): string {
  return `auth:password-reset:ip:${ip}`;
}

export function authPortalLoginIpKey(ip: string): string {
  return `auth:portal-login:ip:${ip}`;
}

export function authPublicFormIpKey(route: string, ip: string): string {
  const safeRoute = route.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 64) || "form";
  return `auth:public-form:${safeRoute}:ip:${ip}`;
}

export function apiKeyRpmKey(apiKeyId: string): string {
  return `api:key:${apiKeyId}:rpm`;
}

export function apiInvalidKeyIpKey(ip: string): string {
  return `api:invalid-key:ip:${ip}`;
}

export function integrationOrgProviderKey(organizationId: string, providerId: string): string {
  return `integration:${organizationId}:${providerId}:rpm`;
}

export function executiveIntelligenceMinuteKey(organizationId: string, userId: string): string {
  return `ei:ai:min:${organizationId}:${userId}`;
}

export function executiveIntelligenceDayKey(organizationId: string): string {
  return `ei:ai:day:${organizationId}`;
}

export function healthIpKey(ip: string): string {
  return `health:ip:${ip}`;
}

export function expensiveExportKey(organizationId: string, userId: string, operation: string): string {
  const op = operation.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 48) || "export";
  return `export:${op}:org:${organizationId}:user:${userId}`;
}