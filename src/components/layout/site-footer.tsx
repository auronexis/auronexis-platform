import Link from "next/link";

import {

  APP_VERSION,

  COMPANY_NAME,

  FOOTER_LINKS,

  FOOTER_SECTIONS,

  SALES_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

import { AdaptiveBrandLogo, BrandLogo } from "@/components/branding/brand-logo";
import { CookiePreferencesButton } from "@/components/consent/cookie-preferences-modal";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";

import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";



type SiteFooterProps = {

  variant?: "default" | "minimal" | "marketing" | "portal";

  className?: string;

  poweredByLabel?: string;

};



function FooterLinkColumn({

  title,

  links,

  dark = false,

}: {

  title: string;

  links: ReadonlyArray<{ label: string; href: string }>;

  dark?: boolean;

}) {

  return (

    <div>

      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          dark ? "text-white/90" : "text-foreground",
        )}
      >
        {title}
      </p>

      <ul className="mt-3 space-y-2">

        {links.map((link) => (

          <li key={link.href}>

            <Link
              href={link.href}
              className={cn(
                "rounded text-sm hover:underline",
                focusRing,
                dark
                  ? "text-primary-foreground/70 hover:text-white"
                  : "text-muted hover:text-foreground",
              )}
            >

              {link.label}

            </Link>

          </li>

        ))}

      </ul>

    </div>

  );

}



export function SiteFooter({ variant = "default", className, poweredByLabel }: SiteFooterProps) {

  const year = new Date().getFullYear();

  const platformBranding = getPlatformBrandingDefaults();



  if (variant === "minimal") {

    return (

      <footer className={cn("border-t border-border/70 bg-surface/40 px-6 py-6", className)}>

        <div className="mx-auto flex max-w-3xl flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">

          <p>

            © {year} {COMPANY_NAME} · Version {APP_VERSION}

          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">

            {FOOTER_LINKS.slice(0, 4).map((link) => (

              <Link key={link.href} href={link.href} className={cn("rounded hover:text-foreground hover:underline", focusRing)}>

                {link.label}

              </Link>

            ))}

          </div>

        </div>

      </footer>

    );

  }



  if (variant === "marketing") {

    return (

      <footer className={cn("border-t border-white/10 bg-secondary", className)}>

        <div className="mx-auto max-w-6xl px-6 py-12">

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            <div>

              <BrandLogo
                branding={platformBranding}
                layout="horizontal"
                variant="light"
                className="h-9 w-auto max-w-[200px] object-contain"
              />

              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">

                Operations Command Center for AI automation agencies.

              </p>

              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={cn(
                  "mt-4 inline-block rounded text-sm text-primary-foreground/90 hover:text-white hover:underline",
                  focusRing,
                )}
              >

                {SUPPORT_EMAIL}

              </a>
              <p className="mt-2 text-xs text-primary-foreground/60">
                Sales:{" "}
                <a
                  href={`mailto:${SALES_EMAIL}`}
                  className={cn("rounded hover:text-white hover:underline", focusRing)}
                >
                  {SALES_EMAIL}
                </a>
              </p>

            </div>

            <FooterLinkColumn dark title="Product" links={FOOTER_SECTIONS.product} />

            <FooterLinkColumn dark title="Legal" links={FOOTER_SECTIONS.legal} />

            <FooterLinkColumn dark title="Company" links={FOOTER_SECTIONS.company} />

          </div>



          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:justify-between">

            <p>© {year} {COMPANY_NAME}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <CookiePreferencesButton className="text-primary-foreground/60 hover:text-white" />
              <p>Version {APP_VERSION}</p>
            </div>

          </div>

        </div>

      </footer>

    );

  }



  return (

    <footer

      className={cn(

        "mt-auto border-t border-border/70 bg-surface/40",

        variant === "portal" && "border-primary-foreground/10 text-primary-foreground",

        className,

      )}

    >

      <div className="mx-auto max-w-7xl px-6 py-8">

        <AdaptiveBrandLogo
          branding={platformBranding}
          layout="horizontal"
          className="mb-4 h-7 w-auto max-w-[200px] object-contain"
        />

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">

          {FOOTER_LINKS.map((link) => (

            <Link

              key={link.href}

              href={link.href}

              className={cn(

                "rounded text-muted hover:text-foreground hover:underline",
                focusRing,

                variant === "portal" && "text-primary-foreground/80 hover:text-primary-foreground",

              )}

            >

              {link.label}

            </Link>

          ))}

          <a

            href={`mailto:${SUPPORT_EMAIL}`}

            className={cn(

              "rounded text-muted hover:text-foreground hover:underline",
              focusRing,

              variant === "portal" && "text-primary-foreground/80 hover:text-primary-foreground",

            )}

          >

            {SUPPORT_EMAIL}

          </a>

        </div>



        <div

          className={cn(

            "mt-4 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between",

            variant === "portal" && "text-primary-foreground/70",

          )}

        >

          <p>

            © {year} {poweredByLabel ?? COMPANY_NAME}

            {poweredByLabel ? (

              <>

                {" · "}

                Powered by {COMPANY_NAME}

              </>

            ) : null}

          </p>

          <p>Version {APP_VERSION}</p>

        </div>

      </div>

    </footer>

  );

}


