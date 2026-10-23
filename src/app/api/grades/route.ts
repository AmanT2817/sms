import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";

export const runtime = "nodejs";

/**
 * GET /api/grades?studentId=...&classId=...
 * PROTECTED —
 *   • STUDENT → only their own grades (studentId param ignored)
 *   • TEACHER → grades for students in their classes
 *   • ADMIN   → any grades
 */
export async function GET(request: Request) {
  const ctx = await requireRole("TEACHER", "ADMIN", "STUDENT");
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = ctx;
  const { searchParams } = new URL(request.url);

  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: user.id } });
    if (!student) return NextResponse.json({ grades: [] });
    const grades = await db.grade.findMany({
      where: { studentId: student.id },
      include: { assignment: { include: { class: { include: { subject: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      grades: grades.map((g) => ({
        id: g.id,
        title: g.assignment.title,
        subject: g.assignment.class.subject.name,
        score: g.score,
        maxScore: g.assignment.maxScore,
        percentage: Math.round((g.score / g.assignment.maxScore) * 100),
      })),
    });
  }

  // TEACHER / ADMIN
  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");

  const where: { studentId?: string; assignment?: { classId?: string } } = {};
  if (studentId) where.studentId = studentId;
  if (classId) where.assignment = { classId };

  // TEACHER: restrict to their own classes
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
    const teacherClassIds = await db.class.findMany({
      where: { teacherId: teacher?.id },
      select: { id: true },
    });
    const ids = teacherClassIds.map((c) => c.id);
    where.assignment = { ...where.assignment, classId: { in: ids } };
  }

  const grades = await db.grade.findMany({
    where,
    include: {
      student: { include: { user: true } },
      assignment: { include: { class: { include: { subject: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    grades: grades.map((g) => ({
      id: g.id,
      studentId: g.studentId,
      studentName: g.student.user.name,
      admissionNumber: g.student.admissionNumber,
      title: g.assignment.title,
      subject: g.assignment.class.subject.name,
      className: g.assignment.class.name,
      score: g.score,
      maxScore: g.assignment.maxScore,
      percentage: Math.round((g.score / g.assignment.maxScore) * 100),
    })),
  });
}

const gradeSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  assignmentId: z.string().min(1, "assignmentId is required"),
  score: z.number().min(0, "Score cannot be negative"),
});

/**
 * POST /api/grades
 * PROTECTED — TEACHER or ADMIN only.
 * Body: { studentId, assignmentId, score }
 * Upserts the grade (idempotent per student/assignment).
 */
export async function POST(request: Request) {
  const ctx = await requireRole("TEACHER", "ADMIN");
  if (!ctx) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { user } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { studentId, assignmentId, score } = parsed.data;

  // Verify the assignment exists and get its class + maxScore
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  if (score > assignment.maxScore) {
    return NextResponse.json(
      { error: `Score cannot exceed maximum (${assignment.maxScore})` },
      { status: 400 }
    );
  }

  // TEACHER: verify they own the class this assignment belongs to
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
    if (assignment.class.teacherId !== teacher?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const grade = await db.grade.upsert({
    where: { studentId_assignmentId: { studentId, assignmentId } },
    update: { score, recordedById: user.id },
    create: { studentId, assignmentId, score, recordedById: user.id },
  });

  return NextResponse.json({
    id: grade.id,
    studentId,
    assignmentId,
    score,
    maxScore: assignment.maxScore,
    percentage: Math.round((score / assignment.maxScore) * 100),
  });
}
