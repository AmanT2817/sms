import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * GET /api/dashboard
 * PROTECTED — returns the school-facing dashboard data for the logged-in user.
 * If no valid session is present, returns 401 so the client can redirect to
 * the login view. The session check happens here on the server, not on the
 * client, so an unauthenticated visitor cannot read this data even by
 * constructing a direct fetch.
 */
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in." },
      { status: 401 }
    );
  }

  // In a full SMS this is where role-scoped queries would run (the uploaded
  // architecture's RBAC layer). For Phase 1 we return a small, stable payload
  // that demonstrates the dashboard is gated and personalized to the user.
  const totalUsers = await db.user.count();

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    TEACHER: "Teacher",
    STAFF: "Staff",
    STUDENT: "Student",
    PARENT: "Parent",
  };

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      roleLabel: roleLabel[session.role ?? "STAFF"] ?? "Staff",
    },
    stats: {
      totalAccounts: totalUsers,
      term: "Term 1, 2025/2026",
      schoolName: "Greenfield Academy",
    },
    announcements: [
      {
        id: "a1",
        title: "Mid-term exams begin next Monday",
        body: "The mid-term examination period starts Monday. Please check the schedule posted on the academic board.",
        date: "2025-10-20",
      },
      {
        id: "a2",
        title: "Parent–teacher conferences",
        body: "Quarterly parent–teacher meetings are scheduled for Friday afternoon. Sign-up sheets are with the front office.",
        date: "2025-10-18",
      },
      {
        id: "a3",
        title: "Campus maintenance notice",
        body: "The east wing will be closed on Saturday for scheduled maintenance. Classes are unaffected.",
        date: "2025-10-15",
      },
    ],
    quickActions: [
      { id: "q1", label: "View timetable", icon: "calendar" },
      { id: "q2", label: "Recent messages", icon: "mail" },
      { id: "q3", label: "Submit a request", icon: "form" },
      { id: "q4", label: "School calendar", icon: "date" },
    ],
  });
}
