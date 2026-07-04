import { MARKETING_ROUTES } from "@/lib/company/contact";
import {
  ENTERPRISE_BILLING_CONTACT_PATH,
  SUPPORT_BILLING_CONTACT_PATH,
} from "@/lib/billing/billing-contact";
import type { SessionContext } from "@/lib/tenancy/context";

export type MarketingAuthState = {
  isAuthenticated: boolean;
  organizationName?: string;
};

export function getMarketingAuthState(session: SessionContext | null): MarketingAuthState {
  if (!session) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    organizationName: session.organization.name,
  };
}

export function resolveMarketingHeaderActions(auth: MarketingAuthState) {
  if (auth.isAuthenticated) {
    return {
      isAuthenticated: true as const,
      dashboardHref: "/dashboard",
      dashboardLabel: "Return to workspace",
      workspaceName: auth.organizationName,
      billingHref: "/settings/billing",
      settingsHref: "/settings",
      supportHref: "/settings/support",
      enterpriseHref: "/settings/enterprise",
    };
  }

  return {
    isAuthenticated: false as const,
    signInHref: "/login",
    signInLabel: "Sign in",
    signupHref: "/signup",
    signupLabel: "Start free trial",
  };
}

const PUBLIC_AUTH_PATHS = new Set(["/login", "/signup", "/register"]);

const PUBLIC_SIGNUP_LABELS = [/start free trial/i, /get started/i, /^sign up$/i];
const PUBLIC_SIGNIN_LABELS = [/^sign in$/i];

export function remapPublicHrefForAuthenticated(href: string): string {
  if (href === MARKETING_ROUTES.contact || href === "/contact") {
    return SUPPORT_BILLING_CONTACT_PATH;
  }

  if (PUBLIC_AUTH_PATHS.has(href)) {
    return "/dashboard";
  }

  return href;
}

type MarketingHeroInput = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function resolveMarketingHeroActions(
  auth: MarketingAuthState,
  props: MarketingHeroInput,
): MarketingHeroInput {
  if (!auth.isAuthenticated) {
    return props;
  }

  const primaryIsPublicAuth =
    PUBLIC_AUTH_PATHS.has(props.primaryHref) ||
    PUBLIC_SIGNUP_LABELS.some((pattern) => pattern.test(props.primaryLabel));

  const secondaryIsSignIn =
    (props.secondaryHref && PUBLIC_AUTH_PATHS.has(props.secondaryHref)) ||
    (props.secondaryLabel
      ? PUBLIC_SIGNIN_LABELS.some((pattern) => pattern.test(props.secondaryLabel ?? ""))
      : false);

  const primaryIsContactMessage =
    props.primaryHref === "#message" || props.primaryLabel === "Send a message";

  const secondaryIsContactSales =
    props.secondaryHref === MARKETING_ROUTES.contact ||
    props.secondaryHref === "/contact" ||
    props.secondaryLabel === "Contact sales";

  let primaryHref = props.primaryHref;
  let primaryLabel = props.primaryLabel;

  if (primaryIsPublicAuth) {
    primaryHref = "/dashboard";
    primaryLabel = "Return to workspace";
  } else if (primaryIsContactMessage) {
    primaryHref = SUPPORT_BILLING_CONTACT_PATH;
    primaryLabel = "Contact support";
  } else {
    primaryHref = remapPublicHrefForAuthenticated(props.primaryHref);
  }

  let secondaryHref = props.secondaryHref;
  let secondaryLabel = props.secondaryLabel;

  if (secondaryIsSignIn) {
    secondaryHref = undefined;
    secondaryLabel = undefined;
  } else if (secondaryIsContactSales && secondaryHref) {
    secondaryHref = ENTERPRISE_BILLING_CONTACT_PATH;
    secondaryLabel = "Contact sales";
  } else if (secondaryHref) {
    secondaryHref = remapPublicHrefForAuthenticated(secondaryHref);
  }

  return {
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
  };
}

export function resolveMarketingCtaActions(
  auth: MarketingAuthState,
  props: { href: string; label: string },
): { href: string; label: string } {
  if (!auth.isAuthenticated) {
    return props;
  }

  const isPublicSignup =
    PUBLIC_AUTH_PATHS.has(props.href) || PUBLIC_SIGNUP_LABELS.some((pattern) => pattern.test(props.label));

  if (isPublicSignup) {
    return { href: "/dashboard", label: "Return to workspace" };
  }

  return {
    href: remapPublicHrefForAuthenticated(props.href),
    label: props.label,
  };
}

export function resolveAuthenticatedMarketingLink(
  href: string,
  auth: MarketingAuthState,
  intent?: "enterprise" | "support",
): string {
  if (!auth.isAuthenticated) {
    return href;
  }

  if (intent === "enterprise") {
    return ENTERPRISE_BILLING_CONTACT_PATH;
  }

  if (intent === "support") {
    return SUPPORT_BILLING_CONTACT_PATH;
  }

  return remapPublicHrefForAuthenticated(href);
}

export type MarketingHeaderNavLink = {
  href: string;
  label: string;
  variant: "primary" | "secondary" | "text";
};

/** Shared header nav links for marketing shell and standalone public HTML pages. */
export function getMarketingHeaderNavLinks(auth: MarketingAuthState): {
  logoHref: string;
  workspaceName?: string;
  links: MarketingHeaderNavLink[];
} {
  const actions = resolveMarketingHeaderActions(auth);

  if (actions.isAuthenticated) {
    return {
      logoHref: "/dashboard",
      workspaceName: actions.workspaceName,
      links: [
        { href: actions.billingHref, label: "Billing", variant: "text" },
        { href: actions.settingsHref, label: "Settings", variant: "text" },
        { href: actions.supportHref, label: "Support", variant: "text" },
        { href: actions.enterpriseHref, label: "Enterprise", variant: "text" },
        { href: actions.dashboardHref, label: actions.dashboardLabel, variant: "primary" },
      ],
    };
  }

  return {
    logoHref: MARKETING_ROUTES.home,
    links: [
      { href: actions.signInHref, label: actions.signInLabel, variant: "text" },
      { href: actions.signupHref, label: actions.signupLabel, variant: "primary" },
    ],
  };
}

/** Auth-aware app shortcut used on docs hub pages. */
export function resolvePublicAppShortcut(auth: MarketingAuthState): { href: string; label: string } {
  if (auth.isAuthenticated) {
    return { href: "/dashboard", label: "Return to workspace" };
  }

  return { href: "/login", label: "Sign in" };
}
