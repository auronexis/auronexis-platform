import type {
  WhiteLabelDomainSslStatus,
  WhiteLabelDomainVerificationStatus,
} from "@/lib/white-label/types";
import { isValidDomain } from "@/lib/white-label/validation";

export type CustomDomainStatus = {
  domain: string;
  verificationStatus: WhiteLabelDomainVerificationStatus;
  sslStatus: WhiteLabelDomainSslStatus;
  dnsRecord: string;
  instructions: string[];
};

export function validateCustomDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Custom domain is required.");
  }
  if (!isValidDomain(normalized)) {
    throw new Error("Enter a valid domain such as portal.customer.com.");
  }
  return normalized;
}

export function buildCustomDomainStatus(domain: string | null): CustomDomainStatus | null {
  if (!domain) {
    return null;
  }

  return {
    domain,
    verificationStatus: "pending",
    sslStatus: "pending",
    dnsRecord: `_auroranexis.${domain}`,
    instructions: [
      `Add a CNAME record for ${domain} pointing to portal.auroranexis.app.`,
      `Add a TXT record _auroranexis.${domain} with your organization verification token.`,
      "SSL provisioning is architecture-only in v1 — status remains pending until enabled in a future release.",
    ],
  };
}

export function placeholderVerifyDomain(_domain: string): WhiteLabelDomainVerificationStatus {
  return "pending";
}

export function placeholderProvisionSsl(_domain: string): WhiteLabelDomainSslStatus {
  return "pending";
}
