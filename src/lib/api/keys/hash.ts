import { createHash, randomBytes, timingSafeEqual } from "crypto";

const API_KEY_PREFIX = "anx_live_";

export function generateApiKeyMaterial(): { plaintext: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  const plaintext = `${API_KEY_PREFIX}${secret}`;
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
  return token.startsWith(API_KEY_PREFIX) && token.length > API_KEY_PREFIX.length + 16;
}
