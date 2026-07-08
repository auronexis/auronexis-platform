import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";
import { PLATFORM_METADATA } from "@/lib/branding/metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = PLATFORM_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem("auroranexis:user-preferences");if(!raw)return;var prefs=JSON.parse(raw);var theme=prefs&&prefs.appearance&&prefs.appearance.theme||"system";var resolved=theme==="dark"?"dark":theme==="light"?"light":window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.add(resolved);if(prefs.appearance&&prefs.appearance.compactMode)document.documentElement.classList.add("compact-mode");if(prefs.appearance&&prefs.appearance.reduceAnimations)document.documentElement.classList.add("reduce-motion");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AnalyticsProvider>
          {children}
          <CookieConsentBanner />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
