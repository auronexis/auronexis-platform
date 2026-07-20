import type { ReactNode } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { SkipLink } from "@/components/ui/skip-link";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

/** Fixed login logo path — transparent wordmark for dark login surfaces. */
const LOGIN_LOGO_SRC = "/branding/logo-horizontal-transparent.png";

const BRAND_TAGLINE = (
  <>
    Monitor clients.
    <br />
    Detect risks.
    <br />
    Prove value.
  </>
);

type LoginBrandingShellProps = {
  branding: ResolvedOrganizationBranding;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "staff" | "portal";
};

function LoginDecorativePanel({ backgroundUrl }: { backgroundUrl: string }) {
  return (
    <aside
      className="relative hidden min-h-screen w-[42%] max-w-xl shrink-0 overflow-hidden lg:block"
      aria-hidden
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center blur-md"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="absolute inset-0 bg-secondary/75" />
      <div className="relative flex h-full flex-col justify-end p-10 text-white">
        <img
          src={LOGIN_LOGO_SRC}
          alt="Auroranexis logo"
          className="h-auto w-[190px] max-w-[190px] object-contain object-left opacity-100"
        />
        <p className="mt-3 text-sm leading-relaxed text-white/70">{BRAND_TAGLINE}</p>
      </div>
    </aside>
  );
}

export function LoginBrandingShell({
  branding,
  children,
  footer,
  variant = "staff",
}: LoginBrandingShellProps) {
  const loginBackground = branding.loginBackgroundUrl ?? BRANDING_ASSETS.loginBackground;

  if (variant === "portal") {
    return (
      <div className="flex min-h-screen bg-surface-1">
        <SkipLink />
        <LoginDecorativePanel backgroundUrl={loginBackground} />
        <div className="flex min-h-screen flex-1 flex-col">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 items-center justify-center px-4 py-12 outline-none"
          >
            {children}
          </main>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-1">
      <SkipLink />
      <LoginDecorativePanel backgroundUrl={loginBackground} />
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-6 shadow-sm outline-none dark:bg-white"
        >
          {children}
          {branding.supportEmail || branding.supportUrl ? (
            <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted">
              {branding.supportEmail ? (
                <a
                  href={`mailto:${branding.supportEmail}`}
                  className={cn("rounded hover:underline", focusRing)}
                >
                  {branding.supportEmail}
                </a>
              ) : null}
              {branding.supportEmail && branding.supportUrl ? " · " : null}
              {branding.supportUrl ? (
                <a href={branding.supportUrl} className={cn("rounded hover:underline", focusRing)}>
                  Support
                </a>
              ) : null}
            </div>
          ) : null}
        </main>
        {footer ? <div className={cn("mt-6 w-full max-w-md")}>{footer}</div> : null}
      </div>
    </div>
  );
}
