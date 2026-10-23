import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * GET /api/auth/me
 * Returns the currently logged-in user's public profile, or 401.
 * Used by the client to know whether to render the Login form or Dashboard.
 */
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
