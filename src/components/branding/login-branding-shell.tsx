import type { ReactNode } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { getLoginDisplaySubtitle } from "@/lib/branding/defaults";
import { cn } from "@/lib/utils/cn";

type LoginBrandingShellProps = {
  branding: ResolvedOrganizationBranding;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "staff" | "portal";
};

function LoginDecorativePanel({
  backgroundUrl,
  subtitle,
}: {
  backgroundUrl: string;
  subtitle: string;
}) {
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
          src={BRANDING_ASSETS.logoLight}
          alt="Auroranexis logo"
          className="mb-6 h-11 w-auto max-w-[280px] object-contain object-left"
        />
        <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/85">{subtitle}</p>
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
  const subtitle = getLoginDisplaySubtitle(branding);
  const loginBackground = branding.loginBackgroundUrl ?? BRANDING_ASSETS.loginScreen;

  if (variant === "portal") {
    return (
      <div className="flex min-h-screen bg-surface-1">
        <LoginDecorativePanel backgroundUrl={loginBackground} subtitle={subtitle} />
        <div className="flex min-h-screen flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-1">
      <LoginDecorativePanel backgroundUrl={loginBackground} subtitle={subtitle} />
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <img
                src={BRANDING_ASSETS.logoLight}
                alt="Auroranexis logo"
                className="h-11 w-auto max-w-[min(100%,280px)] object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-navy-950">Sign in</h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
          {branding.supportEmail || branding.supportUrl ? (
            <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted">
              {branding.supportEmail ? (
                <a href={`mailto:${branding.supportEmail}`} className="hover:underline">
                  {branding.supportEmail}
                </a>
              ) : null}
              {branding.supportEmail && branding.supportUrl ? " · " : null}
              {branding.supportUrl ? (
                <a href={branding.supportUrl} className="hover:underline">
                  Support
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        {footer ? <div className={cn("mt-6 w-full max-w-md")}>{footer}</div> : null}
      </div>
    </div>
  );
}
