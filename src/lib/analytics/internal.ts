/**
 * Internal and test workspaces — excluded from product analytics so the owner's own visits
 * and test accounts do not count as customer traffic.
 *
 * PostHog's "Internal / Test users" cohort filters on the person property
 * `$internal_or_test_user = true`, which AnalyticsIdentity sets for these users.
 * Organization ids are not secrets; extra ids can be added via
 * NEXT_PUBLIC_ANALYTICS_INTERNAL_ORG_IDS (comma-separated) without a code change.
 */

const INTERNAL_ORGANIZATION_IDS: ReadonlySet<string> = new Set([
  "e097359e-805c-4dbe-ab1e-255700b5406b", // Auroranexis
  "01092811-98cd-4d82-a3c1-64844880e634", // Auroranexis
  "13fad55c-9804-42eb-abd0-37faed8e36f2", // Aurora Demo
  "073dadcd-1ee6-42e0-a2da-8cc60efd531b", // Acme Automation (test)
  "d56ae49d-8967-4f72-b9a8-ab26fb1e9f53", // Owner Testing company
  "b1fd9e76-9f6a-470d-b7d5-c0f014360504", // Northwind Digital (demo workspace)
  "625781d2-f18f-49d3-9f49-dbe23fd03cce", // Testagency
  "1eab3750-c082-470a-aca1-a607526b5aac", // Test Auroranexis.com
  "df827f64-84b7-42e1-91a7-9420febcf843", // Testowner 2.0
  "30baa77d-3b5c-4aa9-899c-8276cbd78435", // Auroranexis AI Solutions
  "36681765-e768-4fd7-b952-35cdb0cd5ef8", // Auroranexis Owner2.0
  "646234b7-e0d3-4f9d-a9c8-2a56c434b392", // Owner-Test Pentest
]);

const INTERNAL_EMAIL_DOMAINS: ReadonlySet<string> = new Set(["auroranexis.com"]);

function extraInternalOrganizationIds(): string[] {
  return (process.env.NEXT_PUBLIC_ANALYTICS_INTERNAL_ORG_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isInternalAnalyticsUser(input: { organizationId: string; email: string | null | undefined }): boolean {
  if (INTERNAL_ORGANIZATION_IDS.has(input.organizationId)) {
    return true;
  }
  if (extraInternalOrganizationIds().includes(input.organizationId)) {
    return true;
  }
  const domain = (input.email ?? "").split("@")[1]?.trim().toLowerCase();
  return Boolean(domain && INTERNAL_EMAIL_DOMAINS.has(domain));
}
