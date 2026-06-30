"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Activity,
  FileText,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Timer,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/branding/brand-logo";
import { SkipLink } from "@/components/ui/skip-link";
import { Icon as AppIcon } from "@/components/ui/icon";
import {
  PortalFooter,
  PortalUserAvatar,
} from "@/components/client-portal/portal-ui";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { signOutPortal } from "@/lib/client-portal/actions";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";



export type PortalNavItem = {

  label: string;

  href: string;

  icon: typeof LayoutDashboard;

};



type PortalShellProps = {

  children: React.ReactNode;

  organizationName: string;

  clientName: string;

  userName: string;

  branding: ResolvedOrganizationBranding;

  navItems: PortalNavItem[];
};



export function PortalShell({

  children,

  organizationName,

  clientName,

  userName,

  branding,

  navItems,

}: PortalShellProps) {

  const pathname = usePathname();



  return (

    <div className="flex min-h-screen flex-col bg-background">

      <SkipLink href="#main-content" />

      <header

        className="text-white shadow-[0_4px_24px_rgba(7,26,61,0.35)]"

        style={{

          background: `linear-gradient(180deg, ${branding.secondaryColor} 0%, ${branding.secondaryColor}DD 100%)`,

        }}

      >

        <div className="mx-auto max-w-7xl px-6 py-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex min-w-0 items-center gap-4">

              <BrandLogo branding={branding} size="lg" variant="light" />

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                  <p className="text-lg font-semibold tracking-tight">{branding.companyName}</p>

                  <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />

                  <p className="text-sm font-medium text-blue-200/90">Client Portal</p>

                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/80">

                  <span>

                    <span className="text-muted">Client:</span> {clientName}

                  </span>

                  <span className="hidden text-white/20 sm:inline" aria-hidden>

                    |

                  </span>

                  <span>

                    <span className="text-muted">Organization:</span> {organizationName}

                  </span>

                </div>

              </div>

            </div>



            <div className="flex items-center gap-3 sm:gap-4">

              <div className="hidden items-center gap-3 sm:flex">

                <PortalUserAvatar name={userName} primaryColor={branding.primaryColor} />

                <p className="text-sm font-medium text-primary-foreground">{userName}</p>

              </div>

              <form action={signOutPortal}>

                <button
                  type="submit"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 text-sm font-medium text-white",
                    transitionInteractive,
                    "hover:border-white/30 hover:bg-white/10 hover:shadow-sm",
                    focusRing,
                    pressable,
                  )}
                >
                  <AppIcon icon={LogOut} size="sm" className="text-current" />

                  Sign out

                </button>

              </form>

            </div>

          </div>

        </div>



        <nav className="border-t border-white/10 bg-black/10">

          <div className="mx-auto max-w-7xl px-6">

            <ul className="flex gap-1 overflow-x-auto py-2">

              {navItems.map((item) => {

                const active =

                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                const NavIcon = item.icon;



                return (

                  <li key={item.href}>

                    <Link

                      href={item.href}

                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
                        transitionInteractive,
                        focusRing,
                        active
                          ? "text-white shadow-md shadow-blue-900/30"
                          : "text-muted hover:bg-white/10 hover:text-primary-foreground",
                      )}

                      style={active ? { backgroundColor: branding.primaryColor } : undefined}

                    >

                      <AppIcon icon={NavIcon} size="sm" className="text-current" />

                      {item.label}

                    </Link>

                  </li>

                );

              })}

            </ul>

          </div>

        </nav>

      </header>



      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>



      <PortalFooter branding={branding} />

    </div>

  );

}



export const PORTAL_NAV_ITEMS = {
  overview: { label: "Overview", href: "/client-portal/overview", icon: LayoutDashboard },
  health: { label: "Health", href: "/client-portal/health", icon: Activity },
  reports: { label: "Reports", href: "/client-portal/reports", icon: FileText },
  sla: { label: "SLA", href: "/client-portal/sla", icon: Timer },
  timeline: { label: "Timeline", href: "/client-portal/timeline", icon: History },
  contacts: { label: "Contacts", href: "/client-portal/contacts", icon: Users },
  support: { label: "Support", href: "/client-portal/support", icon: LifeBuoy },
} as const;


