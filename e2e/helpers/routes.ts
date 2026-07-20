/** Shared public and authenticated route lists for Playwright QA. */

export const PUBLIC_MARKETING_ROUTES = [
  "/",
  "/pricing",
  "/features",
  "/about",
  "/contact",
  "/docs",
  "/faq",
  "/security",
  "/status",
] as const;

export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"] as const;

export const PROTECTED_APP_ROUTES = [
  "/dashboard",
  "/clients",
  "/reports",
  "/risks",
  "/incidents",
  "/settings/billing",
] as const;

export const PORTAL_ROUTES = ["/client-portal/login"] as const;
