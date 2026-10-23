import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export const runtime = "nodejs";

/**
 * GET /api/classes
 * PROTECTED — returns classes scoped to the user's role:
 *   • STUDENT → classes they're enrolled in
 *   • TEACHER → classes they teach
 *   • ADMIN   → all classes
 */
export async function GET() {
  const ctx = await requireAuth();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = ctx;

  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                subject: true,
                teacher: { include: { user: true } },
                _count: { select: { enrollments: true, assignments: true } },
              },
            },
          },
        },
      },
    });
    if (!student) return NextResponse.json({ classes: [] });
    return NextResponse.json({
      classes: student.enrollments.map((e) => ({
        id: e.class.id,
        name: e.class.name,
        subject: e.class.subject.name,
        teacher: e.class.teacher?.user.name ?? "Unassigned",
        academicYear: e.class.academicYear,
        term: e.class.term,
        studentCount: e.class._count.enrollments,
        assignmentCount: e.class._count.assignments,
      })),
    });
  }

  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
      include: {
        classes: {
          include: {
            subject: true,
            _count: { select: { enrollments: true, assignments: true } },
          },
        },
      },
    });
    if (!teacher) return NextResponse.json({ classes: [] });
    return NextResponse.json({
      classes: teacher.classes.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject.name,
        academicYear: c.academicYear,
        term: c.term,
        studentCount: c._count.enrollments,
        assignmentCount: c._count.assignments,
      })),
    });
  }

  // ADMIN (or any other staff role) → all classes
  const classes = await db.class.findMany({
    include: {
      subject: true,
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject.name,
      teacher: c.teacher?.user.name ?? "Unassigned",
      academicYear: c.academicYear,
      term: c.term,
      studentCount: c._count.enrollments,
      assignmentCount: c._count.assignments,
    })),
  });
}
