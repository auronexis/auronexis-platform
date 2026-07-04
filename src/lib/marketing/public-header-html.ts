import {
  getMarketingHeaderNavLinks,
  type MarketingAuthState,
} from "@/lib/marketing/auth-context";

/** Sticky public header HTML for standalone pages such as /api/docs. */
export function buildStandalonePublicHeaderHtml(auth: MarketingAuthState): string {
  const nav = getMarketingHeaderNavLinks(auth);
  const textLinks = nav.links.filter((link) => link.variant === "text");
  const primaryLink = nav.links.find((link) => link.variant === "primary");

  const desktopNavLinks = auth.isAuthenticated
    ? textLinks
        .map(
          (link) =>
            `<a class="site-nav-link" href="${link.href}">${escapeHtml(link.label)}</a>`,
        )
        .join("")
    : "";

  const actionTextLinks = auth.isAuthenticated
    ? ""
    : textLinks
        .map(
          (link) =>
            `<a class="site-action-link" href="${link.href}">${escapeHtml(link.label)}</a>`,
        )
        .join("");

  return `<div class="site-header">
  <div class="site-header-inner">
    <a class="site-logo" href="${nav.logoHref}" aria-label="Auroranexis home">
      <img src="/branding/logo-horizontal-transparent.png" alt="Auroranexis logo" width="170" height="44" />
    </a>
    <nav class="site-nav" aria-label="Primary">
      ${desktopNavLinks}
    </nav>
    <div class="site-actions">
      ${
        nav.workspaceName
          ? `<span class="site-workspace">${escapeHtml(nav.workspaceName)}</span>`
          : ""
      }
      ${actionTextLinks}
      ${
        primaryLink
          ? `<a class="site-btn-primary" href="${primaryLink.href}">${escapeHtml(primaryLink.label)}</a>`
          : ""
      }
    </div>
  </div>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const STANDALONE_PUBLIC_HEADER_STYLES = `
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
  background: rgba(15, 33, 64, 0.95);
  backdrop-filter: blur(8px);
}
.site-header-inner {
  max-width: 56rem;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.site-logo {
  display: flex;
  shrink: 0;
  align-items: center;
  min-width: 0;
}
.site-logo img {
  display: block;
  height: 2.75rem;
  width: auto;
  max-width: 170px;
  object-fit: contain;
  object-position: left center;
}
.site-nav {
  display: none;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}
.site-nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.82);
  text-decoration: none;
}
.site-nav-link:hover {
  color: #fff;
  text-decoration: none;
}
.site-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  shrink: 0;
}
.site-action-link {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.82);
  text-decoration: none;
}
.site-action-link:hover {
  color: #fff;
  text-decoration: none;
}
.site-workspace {
  display: none;
  max-width: 11rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: var(--muted);
}
.site-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}
.site-btn-primary:hover {
  background: var(--primary-hover);
  color: #fff;
  text-decoration: none;
}
@media (min-width: 768px) {
  .site-nav { display: flex; }
  .site-workspace { display: inline; }
}
`;
