// Quick script to generate bcrypt hashes for the Neon SQL insert script.
import bcrypt from "bcryptjs";

const PASSWORD = "password123";
const hashes: Record<string, string> = {};
hashes.admin = bcrypt.hashSync(PASSWORD, 10);
hashes.teacher1 = bcrypt.hashSync(PASSWORD, 10);
hashes.teacher2 = bcrypt.hashSync(PASSWORD, 10);
for (let i = 1; i <= 5; i++) hashes[`student${i}`] = bcrypt.hashSync(PASSWORD, 10);

// Verify each hash actually matches
for (const [k, h] of Object.entries(hashes)) {
  const ok = bcrypt.compareSync(PASSWORD, h);
  console.log(`${k.padEnd(10)} → ${h}  [verify: ${ok ? "OK" : "FAIL"}]`);
}
