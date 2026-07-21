import crypto from "node:crypto";

const TOKEN_BYTES = 32;
const TTL_MINUTES = 15;

export function generateToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const hash = hashToken(plain);
  return { plain, hash };
}

export function hashToken(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export function ttlMinutes(): number {
  return TTL_MINUTES;
}
