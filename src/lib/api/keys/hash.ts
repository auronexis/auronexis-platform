import { createHash, randomBytes, timingSafeEqual } from "crypto";

const API_KEY_PREFIXES = ["ax_live_", "ax_test_", "anx_live_"] as const;

export type ApiKeyMode = "live" | "test";

export function generateApiKeyMaterial(mode: ApiKeyMode = "live"): {
  plaintext: string;
  prefix: string;
  hash: string;
} {
  const keyPrefix = mode === "test" ? "ax_test_" : "ax_live_";
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `${keyPrefix}${secret}`;
  const prefix = plaintext.slice(0, 16);
  return {
    plaintext,
    prefix,
    hash: hashApiKey(plaintext),
  };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function constantTimeCompareHash(storedHash: string, candidateHash: string): boolean {
  const left = Buffer.from(storedHash, "utf8");
  const right = Buffer.from(candidateHash, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function isApiKeyFormat(token: string): boolean {
  return (
    API_KEY_PREFIXES.some((prefix) => token.startsWith(prefix)) &&
    token.length > 24
  );
}
