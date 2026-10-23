import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * Require an authenticated session. Returns the session + the user's profile,
 * or `null` if not authenticated. Used by every protected API route.
 *
 * The session check happens here on the server — the client cannot bypass it.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  return { session, user };
}

/**
 * Require an authenticated session AND one of the allowed roles.
 * Returns 401 (unauth) or 403 (forbidden) NextResponse tuples for the caller
 * to short-circuit with. On success returns the auth context.
 *
 * Usage:
 *   const auth = await requireRole("TEACHER", "ADMIN");
 *   if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   // ... use auth.user
 */
export async function requireRole(
  ...allowedRoles: string[]
): Promise<{ user: { id: string; email: string; name: string; role: string } } | null> {
  const ctx = await requireAuth();
  if (!ctx) return null;
  if (!allowedRoles.includes(ctx.user.role)) return null;
  return { user: ctx.user };
}
