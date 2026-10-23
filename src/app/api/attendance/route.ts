import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";

export const runtime = "nodejs";

const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

/**
 * GET /api/attendance?classId=...&date=YYYY-MM-DD
 * PROTECTED — returns attendance for a class on a given day.
 *   • TEACHER → only their own classes
 *   • ADMIN   → any class
 *   • STUDENT → only their own attendance records
 */
export async function GET(request: Request) {
  const ctx = await requireRole("TEACHER", "ADMIN", "STUDENT");
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user } = ctx;
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const dateStr = searchParams.get("date");

  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        attendance: {
          include: { class: { include: { subject: true } } },
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });
    if (!student) return NextResponse.json({ records: [] });
    return NextResponse.json({
      records: student.attendance.map((a) => ({
        id: a.id,
        date: a.date.toISOString().slice(0, 10),
        status: a.status,
        subject: a.class.subject.name,
      })),
    });
  }

  // TEACHER / ADMIN — by class + optional date
  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  // TEACHER: verify they own this class
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
    const cls = await db.class.findUnique({ where: { id: classId } });
    if (!cls || cls.teacherId !== teacher?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const where: { classId: string; date?: Date } = { classId };
  if (dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    where.date = d;
  }

  const records = await db.attendance.findMany({
    where,
    include: { student: { include: { user: true } } },
    orderBy: [{ date: "desc" }, { student: { admissionNumber: "asc" } }],
  });

  return NextResponse.json({
    records: records.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.user.name,
      admissionNumber: a.student.admissionNumber,
      date: a.date.toISOString().slice(0, 10),
      status: a.status,
    })),
  });
}

const recordSchema = z.object({
  classId: z.string().min(1, "classId is required"),
  date: z.string().min(1, "date is required"), // YYYY-MM-DD
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(VALID_STATUSES),
      })
    )
    .min(1, "At least one attendance entry is required"),
});

/**
 * POST /api/attendance
 * PROTECTED — TEACHER or ADMIN only.
 * Body: { classId, date, entries: [{ studentId, status }] }
 * Upserts attendance records for each student (idempotent per student/class/date).
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

  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { classId, date, entries } = parsed.data;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  // TEACHER: verify they own this class
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
    const cls = await db.class.findUnique({ where: { id: classId } });
    if (!cls || cls.teacherId !== teacher?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Upsert each entry in a transaction
  const results = await db.$transaction(
    entries.map((entry) =>
      db.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: entry.studentId,
            classId,
            date: day,
          },
        },
        update: { status: entry.status, recordedById: user.id },
        create: {
          studentId: entry.studentId,
          classId,
          date: day,
          status: entry.status,
          recordedById: user.id,
        },
      })
    )
  );

  return NextResponse.json({
    saved: results.length,
    date: day.toISOString().slice(0, 10),
  });
}
