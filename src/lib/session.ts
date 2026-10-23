import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

/**
 * Session shape stored inside the encrypted cookie.
 * Only the minimum identity info lives here — the password hash never does.
 */
export interface SchoolSession {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-only-fallback-secret-change-in-production";

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: "school_portal_session",
  cookieOptions: {
    httpOnly: true, // not readable by JS — mitigates XSS token theft
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // mitigates CSRF for top-level navigations
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_SECONDS ?? 86400),
  },
};

/**
 * Get the current session. Must be called inside a Server Component / Route
 * Handler / Server Action (anywhere `next/headers` cookies() is available).
 */
export async function getSession(): Promise<SchoolSession> {
  const cookieStore = await cookies();
  return getIronSession<SchoolSession>(cookieStore, sessionOptions);
}

/** Returns true if the request has a valid logged-in session. */
export async function isAuthenticated(): Promise<boolean> {
  const s = await getSession();
  return Boolean(s.userId);
}

/** Destroy the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const s = await getSession();
  s.destroy();
}
