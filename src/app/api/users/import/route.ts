import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireRole } from "@/lib/auth-guard";

export const runtime = "nodejs";

const DEFAULT_PASSWORD = "password123";

// Single row schema — what we expect each CSV line to look like after parsing.
const rowSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "TEACHER", "STAFF", "STUDENT", "PARENT"]),
  // Optional student-only fields — ignored for non-student roles
  gradeLevel: z.string().optional(),
  admissionNumber: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  // Optional teacher-only fields
  employeeId: z.string().optional(),
  department: z.string().optional(),
});

type Row = z.infer<typeof rowSchema>;

interface ImportResult {
  row: number;
  email: string;
  status: "created" | "updated" | "error";
  message: string;
  password?: string;
}

/**
 * Parse CSV text into rows. Handles quoted fields, commas inside quotes,
 * and CRLF line endings. Header row is required.
 *
 * Expected columns (case-insensitive, in any order):
 *   email, name, role, gradeLevel?, admissionNumber?, guardianName?,
 *   guardianPhone?, employeeId?, department?
 */
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Normalize line endings, strip BOM
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error("CSV is empty");

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? "";
    });
    rows.push(obj);
  }
  return { headers, rows };
}

/**
 * POST /api/users/import
 * PROTECTED — ADMIN only.
 * Body: { csv: "<csv string>" }  OR  multipart form upload with file field "file"
 * Creates/updates users in bulk. Each row gets the default password
 * (`password123` unless changed in code). Returns per-row results so the
 * admin sees exactly what happened.
 */
export async function POST(request: Request) {
  const ctx = await requireRole("ADMIN");
  if (!ctx) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let csvText = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || !("csv" in body)) {
      return NextResponse.json({ error: "Expected { csv: string } or multipart file upload" }, { status: 400 });
    }
    csvText = String((body as { csv: unknown }).csv);
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV content is empty" }, { status: 400 });
  }

  let parsed: { headers: string[]; rows: Record<string, string>[] };
  try {
    parsed = parseCSV(csvText);
  } catch (e) {
    return NextResponse.json(
      { error: `CSV parse failed: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  // Validate required headers
  const required = ["email", "name", "role"];
  const missing = required.filter((h) => !parsed.headers.includes(h));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required columns: ${missing.join(", ")}. Required: email, name, role` },
      { status: 400 }
    );
  }

  const results: ImportResult[] = [];
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  for (let i = 0; i < parsed.rows.length; i++) {
    const rowNum = i + 2; // +2 because row 1 is header, row 2 is first data
    const raw = parsed.rows[i];

    const parseResult = rowSchema.safeParse({
      email: raw.email,
      name: raw.name,
      role: raw.role?.toUpperCase(),
      gradeLevel: raw.gradelevel || undefined,
      admissionNumber: raw.admissionnumber || undefined,
      guardianName: raw.guardianname || undefined,
      guardianPhone: raw.guardianphone || undefined,
      employeeId: raw.employeeid || undefined,
      department: raw.department || undefined,
    });

    if (!parseResult.success) {
      results.push({
        row: rowNum,
        email: raw.email ?? "(no email)",
        status: "error",
        message: parseResult.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    const row: Row = parseResult.data;
    const lowerEmail = row.email.toLowerCase();

    try {
      // Upsert user
      const user = await db.user.upsert({
        where: { email: lowerEmail },
        update: { name: row.name, role: row.role, passwordHash },
        create: {
          email: lowerEmail,
          name: row.name,
          role: row.role,
          passwordHash,
        },
      });

      // For STUDENT role, also upsert the Student profile
      if (row.role === "STUDENT") {
        const admissionNumber = row.admissionNumber ?? `ADM-${Date.now()}-${i + 1}`;
        await db.student.upsert({
          where: { admissionNumber },
          update: {
            userId: user.id,
            gradeLevel: row.gradeLevel ?? "Unspecified",
            guardianName: row.guardianName,
            guardianPhone: row.guardianPhone,
          },
          create: {
            admissionNumber,
            userId: user.id,
            gradeLevel: row.gradeLevel ?? "Unspecified",
            guardianName: row.guardianName,
            guardianPhone: row.guardianPhone,
          },
        });
      }

      // For TEACHER role, also upsert the Teacher profile
      if (row.role === "TEACHER") {
        const employeeId = row.employeeId ?? `EMP-${Date.now()}-${i + 1}`;
        await db.teacher.upsert({
          where: { employeeId },
          update: {
            userId: user.id,
            department: row.department,
          },
          create: {
            employeeId,
            userId: user.id,
            department: row.department,
          },
        });
      }

      const existed = user.createdAt.getTime() !== user.updatedAt.getTime();
      results.push({
        row: rowNum,
        email: lowerEmail,
        status: existed ? "updated" : "created",
        message: existed ? "User updated" : "User created",
        password: DEFAULT_PASSWORD,
      });
    } catch (e) {
      results.push({
        row: rowNum,
        email: lowerEmail,
        status: "error",
        message: (e as Error).message ?? "Database error",
      });
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.status === "created").length,
    updated: results.filter((r) => r.status === "updated").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
