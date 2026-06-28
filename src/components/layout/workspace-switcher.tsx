"use client";

import { ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Icon } from "@/components/ui/icon";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type WorkspaceSwitcherProps = {
  branding: ResolvedOrganizationBranding;
  organizationName: string;
  collapsed?: boolean;
};

/** Premium workspace header block — visual only, no switching backend. */
export function WorkspaceSwitcher({
  branding,
  organizationName,
  collapsed = false,
}: WorkspaceSwitcherProps) {
  return (
    <button
      type="button"
      className={cn(
        "group/workspace flex w-full cursor-pointer items-center rounded-xl text-left",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2.5",
        transitionInteractive,
        "hover:bg-white/5 hover:shadow-[0_0_0_1px_rgb(255_255_255_/_0.06)]",
        focusRing,
      )}
      aria-label={`${branding.companyName} workspace`}
    >
      <BrandLogo
        branding={branding}
        layout={collapsed ? "mark" : "horizontal"}
        variant="light"
        className={collapsed ? "h-9 w-9" : "h-9 w-auto max-w-[min(100%,220px)]"}
      />
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold tracking-tight text-white transition-colors duration-150 group-hover/workspace:text-white">
              {organizationName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-wider text-muted transition-colors duration-150 group-hover/workspace:text-primary-foreground">
              Workspace
            </span>
          </span>
          <Icon
            icon={ChevronDown}
            size="sm"
            className="shrink-0 text-muted transition-transform duration-150 group-hover/workspace:rotate-12 group-hover/workspace:text-primary-foreground"
          />
        </>
      )}
    </button>
  );
}
