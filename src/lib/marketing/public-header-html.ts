import {
  getPublicHeaderNavLinks,
  type MarketingAuthState,
} from "@/lib/marketing/auth-context";

function renderNavLink(link: { href: string; label: string }, className: string): string {
  return `<a class="${className}" href="${link.href}">${escapeHtml(link.label)}</a>`;
}

/** Sticky public header HTML for standalone pages such as /api/docs. */
export function buildStandalonePublicHeaderHtml(auth: MarketingAuthState): string {
  const header = getPublicHeaderNavLinks(auth, "compact");

  const navHtml = header.navLinks
    .map((link) => renderNavLink(link, "site-nav-link"))
    .join("");

  const actionsHtml = header.actionLinks
    .map((link) =>
      link.variant === "primary"
        ? renderNavLink(link, "site-btn-primary")
        : renderNavLink(link, "site-action-link"),
    )
    .join("");

  return `<div class="site-header site-header--compact">
  <div class="site-header-inner">
    <a class="site-logo" href="${header.logoHref}" aria-label="Auroranexis home">
      <img src="/branding/logo-horizontal-transparent.png" alt="Auroranexis logo" width="170" height="44" />
    </a>
    <nav class="site-nav" aria-label="Primary">
      ${navHtml}
    </nav>
    <div class="site-actions">
      ${
        header.workspaceName
          ? `<span class="site-workspace">${escapeHtml(header.workspaceName)}</span>`
          : ""
      }
      ${actionsHtml}
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
  gap: 0.75rem;
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  gap: 0.125rem;
  min-width: 0;
  flex: 1 1 auto;
  justify-content: center;
}
.site-nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.82);
  text-decoration: none;
  white-space: nowrap;
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
  margin-left: auto;
}
.site-action-link {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.82);
  text-decoration: none;
  white-space: nowrap;
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
  white-space: nowrap;
}
.site-btn-primary:hover {
  background: var(--primary-hover);
  color: #fff;
  text-decoration: none;
}
@media (min-width: 768px) {
  .site-workspace { display: inline; }
  .site-header--compact .site-header-inner { flex-wrap: nowrap; }
  .site-header--compact .site-nav { justify-content: flex-start; flex: 0 1 auto; }
}
`;
