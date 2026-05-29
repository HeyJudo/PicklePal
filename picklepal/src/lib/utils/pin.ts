/**
 * PIN hashing and verification utilities.
 * Uses SHA-256 via Web Crypto API (available in Node.js and browsers).
 */

/**
 * Hash a PIN string using SHA-256.
 * Returns a hex-encoded hash string.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a PIN against a stored hash.
 * Returns true if the PIN matches the hash.
 */
export async function verifyPin(
  pin: string,
  storedHash: string,
): Promise<boolean> {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}
