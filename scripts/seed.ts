/**
 * Seed script — Phase 1 + Phase 2
 *
 * Creates:
 *   • 1 admin         (admin@greenfield.edu  / password123)
 *   • 2 teachers      (teacher.abebe@...      / password123)
 *                    (teacher.sara@...       / password123)
 *   • 5 students      (student.1..5@greenfield.edu / password123)
 *   • 3 subjects, 3 classes, enrollments
 *   • Attendance records for the last 5 school days
 *   • 2 assignments per class + grades for enrolled students
 *
 * Idempotent: upserts the admin and uses deterministic CUID-like IDs via
 * `upsert` keyed on natural unique fields (email, admissionNumber, code, name).
 *
 * Usage:
 *   bun run db:push     # ensure schema exists
 *   bun run seed        # create / refresh all sample data
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PASSWORD = "password123"; // demo only — change in any real deployment
const SALT = 10;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function hash(p: string) {
  return bcrypt.hash(p, SALT);
}

async function main() {
  const passwordHash = await hash(PASSWORD);

  // ── Subjects ──────────────────────────────────────────────────────────────
  const math = await db.subject.upsert({
    where: { code: "MATH" },
    update: {},
    create: { name: "Mathematics", code: "MATH" },
  });
  const eng = await db.subject.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "English", code: "ENG" },
  });
  const sci = await db.subject.upsert({
    where: { code: "SCI" },
    update: {},
    create: { name: "Science", code: "SCI" },
  });

  // ── Admin user ────────────────────────────────────────────────────────────
  const admin = await db.user.upsert({
    where: { email: "admin@greenfield.edu" },
    update: { passwordHash, name: "Ada Admin", role: "ADMIN" },
    create: {
      email: "admin@greenfield.edu",
      name: "Ada Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  // ── Teachers (User + Teacher profile) ─────────────────────────────────────
  const t1User = await db.user.upsert({
    where: { email: "teacher.abebe@greenfield.edu" },
    update: { passwordHash, name: "Abebe Bekele", role: "TEACHER" },
    create: {
      email: "teacher.abebe@greenfield.edu",
      name: "Abebe Bekele",
      role: "TEACHER",
      passwordHash,
    },
  });
  const t1 = await db.teacher.upsert({
    where: { employeeId: "EMP-001" },
    update: { userId: t1User.id, department: "Mathematics" },
    create: {
      employeeId: "EMP-001",
      userId: t1User.id,
      department: "Mathematics",
    },
  });

  const t2User = await db.user.upsert({
    where: { email: "teacher.sara@greenfield.edu" },
    update: { passwordHash, name: "Sara Tesfaye", role: "TEACHER" },
    create: {
      email: "teacher.sara@greenfield.edu",
      name: "Sara Tesfaye",
      role: "TEACHER",
      passwordHash,
    },
  });
  const t2 = await db.teacher.upsert({
    where: { employeeId: "EMP-002" },
    update: { userId: t2User.id, department: "English" },
    create: {
      employeeId: "EMP-002",
      userId: t2User.id,
      department: "English",
    },
  });

  // ── Students (User + Student profile) ─────────────────────────────────────
  const studentSpecs = [
    { num: 1, name: "Kidist Alemu",   grade: "Grade 10", guardian: "Alemu Worku",   phone: "+251 911 000 001" },
    { num: 2, name: "Yonas Girma",    grade: "Grade 10", guardian: "Girma Tadesse", phone: "+251 911 000 002" },
    { num: 3, name: "Helen Negash",   grade: "Grade 10", guardian: "Negash Solomon",phone: "+251 911 000 003" },
    { num: 4, name: "Dawit Haile",    grade: "Grade 10", guardian: "Haile Berhe",   phone: "+251 911 000 004" },
    { num: 5, name: "Merit Assefa",   grade: "Grade 10", guardian: "Assefa Girma",  phone: "+251 911 000 005" },
  ];

  const students = [];
  for (const s of studentSpecs) {
    const email = `student.${s.num}@greenfield.edu`;
    const u = await db.user.upsert({
      where: { email },
      update: { passwordHash, name: s.name, role: "STUDENT" },
      create: { email, name: s.name, role: "STUDENT", passwordHash },
    });
    const stu = await db.student.upsert({
      where: { admissionNumber: `ADM-2025-${String(s.num).padStart(3, "0")}` },
      update: { userId: u.id, gradeLevel: s.grade, guardianName: s.guardian, guardianPhone: s.phone },
      create: {
        admissionNumber: `ADM-2025-${String(s.num).padStart(3, "0")}`,
        userId: u.id,
        gradeLevel: s.grade,
        guardianName: s.guardian,
        guardianPhone: s.phone,
      },
    });
    students.push(stu);
  }

  // ── Classes ───────────────────────────────────────────────────────────────
  const classMath = await db.class.upsert({
    where: { name: "10A Mathematics" },
    update: { subjectId: math.id, teacherId: t1.id, academicYear: "2025/2026", term: "Term 1" },
    create: { name: "10A Mathematics", subjectId: math.id, teacherId: t1.id, academicYear: "2025/2026", term: "Term 1" },
  });
  const classEng = await db.class.upsert({
    where: { name: "10A English" },
    update: { subjectId: eng.id, teacherId: t2.id, academicYear: "2025/2026", term: "Term 1" },
    create: { name: "10A English", subjectId: eng.id, teacherId: t2.id, academicYear: "2025/2026", term: "Term 1" },
  });
  const classSci = await db.class.upsert({
    where: { name: "10A Science" },
    update: { subjectId: sci.id, teacherId: t1.id, academicYear: "2025/2026", term: "Term 1" },
    create: { name: "10A Science", subjectId: sci.id, teacherId: t1.id, academicYear: "2025/2026", term: "Term 1" },
  });

  const allClasses = [classMath, classEng, classSci];

  // ── Enrollments — every student in every class ────────────────────────────
  for (const stu of students) {
    for (const cls of allClasses) {
      await db.enrollment.upsert({
        where: { studentId_classId: { studentId: stu.id, classId: cls.id } },
        update: {},
        create: { studentId: stu.id, classId: cls.id },
      });
    }
  }

  // ── Attendance — last 5 weekdays ──────────────────────────────────────────
  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"];
  let ai = 0;
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const d = daysAgo(dayOffset);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    for (const cls of allClasses) {
      for (const stu of students) {
        const status = attendanceStatuses[ai % attendanceStatuses.length];
        ai++;
        await db.attendance.upsert({
          where: {
            studentId_classId_date: { studentId: stu.id, classId: cls.id, date: d },
          },
          update: { status, recordedById: admin.id },
          create: { studentId: stu.id, classId: cls.id, date: d, status, recordedById: admin.id },
        });
      }
    }
  }

  // ── Assignments + Grades ──────────────────────────────────────────────────
  const assignmentSpecs = [
    { classId: classMath.id, title: "Algebra Problem Set 1", maxScore: 20, dueOffset: 2 },
    { classId: classMath.id, title: "Geometry Quiz",          maxScore: 15, dueOffset: 9 },
    { classId: classEng.id,  title: "Essay: My Hometown",     maxScore: 25, dueOffset: 3 },
    { classId: classEng.id,  title: "Reading Comprehension",  maxScore: 10, dueOffset: 7 },
    { classId: classSci.id,  title: "Lab Report: Density",    maxScore: 20, dueOffset: 4 },
    { classId: classSci.id,  title: "Cells Quiz",             maxScore: 15, dueOffset: 10 },
  ];

  for (const a of assignmentSpecs) {
    const due = new Date();
    due.setDate(due.getDate() + a.dueOffset);
    due.setHours(23, 59, 0, 0);

    const assignment = await db.assignment.upsert({
      where: { classId_title: { classId: a.classId, title: a.title } },
      update: { maxScore: a.maxScore, dueDate: due },
      create: { classId: a.classId, title: a.title, maxScore: a.maxScore, dueDate: due },
    });

    // Grade every enrolled student on this assignment (deterministic-ish scores).
    const enrollments = await db.enrollment.findMany({
      where: { classId: a.classId },
      select: { studentId: true },
    });
    for (let i = 0; i < enrollments.length; i++) {
      const stu = enrollments[i];
      const score = Math.max(0, a.maxScore - (i % 4) * 2); // 100%, 90%, 80%, 70%, 100%...
      await db.grade.upsert({
        where: {
          studentId_assignmentId: { studentId: stu.studentId, assignmentId: assignment.id },
        },
        update: { score, recordedById: admin.id },
        create: { studentId: stu.studentId, assignmentId: assignment.id, score, recordedById: admin.id },
      });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const counts = {
    users: await db.user.count(),
    students: await db.student.count(),
    teachers: await db.teacher.count(),
    classes: await db.class.count(),
    subjects: await db.subject.count(),
    enrollments: await db.enrollment.count(),
    attendance: await db.attendance.count(),
    assignments: await db.assignment.count(),
    grades: await db.grade.count(),
  };

  console.log("✓ Seed complete. Counts:");
  console.table(counts);
  console.log("\nTest accounts (password for all: password123):");
  console.log("  admin   : admin@greenfield.edu");
  console.log("  teacher : teacher.abebe@greenfield.edu");
  console.log("  teacher : teacher.sara@greenfield.edu");
  console.log("  student : student.1@greenfield.edu  ... student.5@greenfield.edu");
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
