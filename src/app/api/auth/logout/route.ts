import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST /api/auth/logout
 * Destroys the session cookie. Idempotent — safe to call when not logged in.
 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
