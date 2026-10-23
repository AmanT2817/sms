import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/auth/login-form";
import { Dashboard } from "@/components/dashboard/dashboard";

/**
 * Root page — single user-visible route.
 *
 * The server reads the encrypted session cookie and decides which view to
 * render. The Dashboard component itself also calls the protected
 * /api/dashboard endpoint, so even if a visitor somehow got the Dashboard HTML
 * into the browser, the data fetch would 401 and bounce them back here.
 *
 * This satisfies the "dashboard unreachable without a valid session"
 * requirement at two layers:
 *   1. Server-side render: unauthenticated visitors get the Login form.
 *   2. Server-side API:    /api/dashboard returns 401 without a session.
 */
export default async function Home() {
  const session = await getSession();

  if (!session.userId) {
    return <LoginForm />;
  }

  return <Dashboard />;
}
