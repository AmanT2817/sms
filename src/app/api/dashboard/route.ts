import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export const runtime = "nodejs";

/**
 * GET /api/dashboard
 * PROTECTED — returns role-specific dashboard data.
 *
 * RBAC enforced on the server:
 *   • STUDENT → sees only their own classes, attendance, grades, assignments
 *   • TEACHER → sees their assigned classes + students per class
 *   • ADMIN   → sees school-wide counts + recent activity
 *
 * The session check happens here; the client cannot bypass it.
 */
export async function GET() {
  const ctx = await requireAuth();
  if (!ctx) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in." },
      { status: 401 }
    );
  }

  const { user } = ctx;
  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    TEACHER: "Teacher",
    STAFF: "Staff",
    STUDENT: "Student",
    PARENT: "Parent",
  };

  const base = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleLabel: roleLabel[user.role] ?? "Staff",
    },
    stats: {
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
  };

  // ── STUDENT dashboard ────────────────────────────────────────────────────
  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          include: {
            class: {
              include: { subject: true, teacher: { include: { user: true } } },
            },
          },
        },
        attendance: { include: { class: { include: { subject: true } } }, orderBy: { date: "desc" }, take: 10 },
        grades: {
          include: { assignment: { include: { class: { include: { subject: true } } } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ ...base, student: null });
    }

    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter((a) => a.status === "PRESENT").length;
    const attendanceRate =
      totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

    const upcomingAssignments = await db.assignment.findMany({
      where: {
        class: { enrollments: { some: { studentId: student.id } } },
        dueDate: { gte: new Date() },
      },
      include: { class: { include: { subject: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    const averageScore = (() => {
      if (student.grades.length === 0) return null;
      const percentages = student.grades.map(
        (g) => (g.score / g.assignment.maxScore) * 100
      );
      return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    })();

    return NextResponse.json({
      ...base,
      student: {
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        guardianName: student.guardianName,
        classes: student.enrollments.map((e) => ({
          id: e.class.id,
          name: e.class.name,
          subject: e.class.subject.name,
          teacher: e.class.teacher?.user.name ?? "Unassigned",
          academicYear: e.class.academicYear,
          term: e.class.term,
        })),
        attendanceSummary: {
          rate: attendanceRate,
          totalRecords: totalAttendance,
          present: presentCount,
          recent: student.attendance.map((a) => ({
            id: a.id,
            date: a.date.toISOString().slice(0, 10),
            status: a.status,
            subject: a.class.subject.name,
          })),
        },
        grades: student.grades.map((g) => ({
          id: g.id,
          title: g.assignment.title,
          subject: g.assignment.class.subject.name,
          score: g.score,
          maxScore: g.assignment.maxScore,
          percentage: Math.round((g.score / g.assignment.maxScore) * 100),
        })),
        averageScore,
        upcomingAssignments: upcomingAssignments.map((a) => ({
          id: a.id,
          title: a.title,
          subject: a.class.subject.name,
          dueDate: a.dueDate.toISOString().slice(0, 10),
          maxScore: a.maxScore,
        })),
      },
    });
  }

  // ── TEACHER dashboard ────────────────────────────────────────────────────
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({
      where: { userId: user.id },
      include: {
        classes: {
          include: {
            subject: true,
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ ...base, teacher: null });
    }

    const classIds = teacher.classes.map((c) => c.id);

    // Assignments needing grades (due soon, or recently due)
    const assignmentsToGrade = await db.assignment.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: { include: { subject: true } },
        _count: { select: { grades: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
    });

    // Simpler: count students per class via enrollments
    const classesWithCounts = await Promise.all(
      teacher.classes.map(async (c) => {
        const studentCount = await db.enrollment.count({ where: { classId: c.id } });
        return {
          id: c.id,
          name: c.name,
          subject: c.subject.name,
          academicYear: c.academicYear,
          term: c.term,
          studentCount,
        };
      })
    );

    return NextResponse.json({
      ...base,
      teacher: {
        employeeId: teacher.employeeId,
        department: teacher.department,
        classes: classesWithCounts,
        assignmentsToGrade: assignmentsToGrade.map((a) => ({
          id: a.id,
          title: a.title,
          subject: a.class.subject.name,
          className: a.class.name,
          dueDate: a.dueDate.toISOString().slice(0, 10),
          maxScore: a.maxScore,
          gradedCount: a._count.grades,
        })),
        totalStudents: classesWithCounts.reduce((sum, c) => sum + c.studentCount, 0),
      },
    });
  }

  // ── ADMIN dashboard (default) ────────────────────────────────────────────
  const [totalUsers, totalStudents, totalTeachers, totalClasses, totalAssignments, totalGrades] =
    await Promise.all([
      db.user.count(),
      db.student.count(),
      db.teacher.count(),
      db.class.count(),
      db.assignment.count(),
      db.grade.count(),
    ]);

  // Recent attendance records (for activity feed)
  const recentAttendance = await db.attendance.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      student: { include: { user: true } },
      class: { include: { subject: true } },
    },
  });

  return NextResponse.json({
    ...base,
    stats: {
      ...base.stats,
      totalAccounts: totalUsers,
    },
    admin: {
      stats: {
        ...base.stats,
        totalAccounts: totalUsers,
        totalStudents,
        totalTeachers,
        totalClasses,
        totalAssignments,
        totalGrades,
      },
      recentActivity: recentAttendance.map((a) => ({
        id: a.id,
        studentName: a.student.user.name,
        subject: a.class.subject.name,
        date: a.date.toISOString().slice(0, 10),
        status: a.status,
      })),
    },
  });
}
