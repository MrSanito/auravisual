import { webcrypto } from "crypto";

/**
 * Hashes a password using SHA-256 native Web Crypto API.
 * This does not require any external npm packages like bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Use native node/browser subtle crypto digest
  const hashBuffer = await webcrypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert bytes to hex string
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates a plain text password against a stored SHA-256 hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
