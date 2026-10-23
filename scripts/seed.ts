/**
 * Seed script — creates one test account so the login can be tried immediately.
 *
 * Usage:
 *   bun run db:push     # ensure schema exists
 *   bun run seed        # create / reset the test account
 *
 * The script is idempotent: if the test email already exists, it updates the
 * password hash in place (handy when you change SESSION_SECRET or forget the
 * password). It never deletes other users.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const TEST_EMAIL = "admin@greenfield.edu";
const TEST_NAME = "Ada Admin";
const TEST_ROLE = "ADMIN";
const TEST_PASSWORD = "password123"; // demo only — change in any real deployment

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    update: { passwordHash, name: TEST_NAME, role: TEST_ROLE },
    create: {
      email: TEST_EMAIL,
      name: TEST_NAME,
      role: TEST_ROLE,
      passwordHash,
    },
  });

  console.log("✓ Test account ready:");
  console.log("   email    :", user.email);
  console.log("   name     :", user.name);
  console.log("   role     :", user.role);
  console.log("   password :", TEST_PASSWORD, "(hashed in DB — never stored in plaintext)");
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
