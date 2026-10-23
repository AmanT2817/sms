import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/auth/login
 * Validates credentials, creates an encrypted session cookie.
 * Returns 401 on bad credentials with a safe, generic error message
 * (never reveal whether the email or the password was wrong).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Authoritative server-side validation — never trust the client.
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Case-insensitive email lookup — emails are unique but humans mistype case.
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });

  // Always run a hash comparison even if the user was not found, so the
  // response timing does not leak whether an email exists.
  const dummyHash =
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eVjP3wW5P4vK9bX5p1q3oYmO5eEa";
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  await session.save();

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
