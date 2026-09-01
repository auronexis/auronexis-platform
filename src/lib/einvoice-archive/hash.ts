import { createHash } from "node:crypto";

/** SHA-256 of exact original bytes. Never hash a re-serialized string. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  for (let i = 0; i < a.byteLength; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function copyBytes(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(bytes);
}
