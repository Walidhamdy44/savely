import {
  randomBytes,
  createHash,
  timingSafeEqual as cryptoTimingSafeEqual,
} from "crypto";

/**
 * Hashes a raw token string using SHA-256.
 * Used to store and compare tokens without keeping the plaintext.
 *
 * @param token - The raw token string to hash
 * @returns The hex-encoded SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random API token.
 * The token is prefixed with `sav_` for easy identification.
 *
 * @returns A random token string in the format `sav_<64 hex chars>`
 */
export function generateToken(): string {
  return `sav_${randomBytes(32).toString("hex")}`;
}

/**
 * Validates a raw token against a stored hash by hashing the raw
 * token and comparing it to the expected hash using constant-time
 * comparison to prevent timing attacks.
 *
 * @param rawToken - The plaintext token to validate
 * @param storedHash - The stored SHA-256 hash to compare against
 * @returns `true` if the hashed raw token matches the stored hash
 */
export function validateToken(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);

  if (hash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(hash, storedHash);
}

/**
 * Performs a constant-time string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string (must be same length as `a`)
 * @returns `true` if the strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  return cryptoTimingSafeEqual(bufA, bufB);
}
