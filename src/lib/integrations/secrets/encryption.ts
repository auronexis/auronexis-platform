import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SCRYPT_SALT = "auroranexis-integration-secrets-v1";

export type IntegrationEncryptionKeyStatus = {
  configured: boolean;
  isProduction: boolean;
  warning: string | null;
};

export function getIntegrationEncryptionKeyStatus(): IntegrationEncryptionKeyStatus {
  const configured = Boolean(process.env.INTEGRATION_SECRET_KEY?.trim());
  const isProduction = process.env.NODE_ENV === "production";

  if (configured) {
    return { configured: true, isProduction, warning: null };
  }

  return {
    configured: false,
    isProduction,
    warning: isProduction
      ? "INTEGRATION_SECRET_KEY is not configured. Secret creation is blocked in production."
      : "INTEGRATION_SECRET_KEY is not configured. Set it to enable encrypted secret storage.",
  };
}

export function assertEncryptionKeyForSecretCreation(): void {
  const status = getIntegrationEncryptionKeyStatus();
  if (!status.configured && status.isProduction) {
    throw new Error(
      "Integration secret encryption is not configured. Set INTEGRATION_SECRET_KEY before storing credentials.",
    );
  }

  if (!status.configured) {
    throw new Error(
      "INTEGRATION_SECRET_KEY is not configured. Set it in your environment to store integration credentials.",
    );
  }
}

function deriveEncryptionKey(): Buffer {
  const raw = process.env.INTEGRATION_SECRET_KEY?.trim();
  if (!raw) {
    throw new Error("INTEGRATION_SECRET_KEY is not configured.");
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  return scryptSync(raw, SCRYPT_SALT, KEY_LENGTH);
}

export function encryptSecretValue(plaintext: string): string {
  const key = deriveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/** Server-only decrypt — never expose return value to clients or logs. */
export function decryptSecretValue(payload: string): string {
  const key = deriveEncryptionKey();
  const [ivPart, tagPart, dataPart] = payload.split(":");

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const iv = Buffer.from(ivPart, "base64");
  const tag = Buffer.from(tagPart, "base64");
  const encrypted = Buffer.from(dataPart, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
