import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** Hash a plaintext password using bcrypt (industry-standard, never reversible). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Verify a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
