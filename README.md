# Greenfield Academy — School Portal (Phase 1 + Phase 2)

A working school website with a **login page**, **session-protected role-based dashboards**, and **logout**.
Built as Phase 1 (identity + auth) and Phase 2 (academic core) of the broader School Management
System architecture. Later phases (dormitory, cafeteria, finance) plug into this foundation.

## What's built

**Phase 1 — Foundation (identity + auth)**
- Login with email + password (bcrypt-hashed, never plaintext)
- Encrypted session cookies (iron-session)
- Protected dashboard route — unauthenticated visitors get the login form
- Logout

**Phase 2 — Academic core (role-based dashboards)**
- **Student dashboard** — their classes, attendance rate, recent grades, upcoming assignments, average score
- **Teacher dashboard** — their classes with student counts, assignments to grade
- **Admin dashboard** — school-wide stats (users, students, teachers, classes, assignments, grades) + recent attendance activity
- **RBAC-enforced API**:
  - `GET /api/dashboard` — role-specific data
  - `GET /api/classes` — scoped (student sees enrolled, teacher sees taught, admin sees all)
  - `GET /api/attendance` + `POST /api/attendance` — teachers/admins record attendance
  - `GET /api/grades` + `POST /api/grades` — teachers/admins record grades
- **Server-side authorization on every protected request** — hiding a menu item is not security.

---

## Stack & why

| Layer        | Choice                          | Why                                                                                  |
| ------------ | ------------------------------- | ------------------------------------------------------------------------------------ |
| Framework    | **Next.js 16 (App Router) + TypeScript** | Mainstream, well-documented, single-language full stack. Server components read the session before any HTML reaches the browser. |
| Database     | **SQLite via Prisma ORM** (locally) / **PostgreSQL** (Vercel) | Zero-config local DB. Prisma gives typed access and migrations. The schema is portable — only the `provider` line changes for Postgres. |
| Auth         | **iron-session** (encrypted cookie) + **bcryptjs** | Signed/encrypted session cookies — no external session store. bcrypt is the industry-standard password hash. |
| Validation   | **zod**                         | Same schema reused on client (instant feedback) and server (authoritative).          |
| UI           | **Tailwind CSS + shadcn/ui**    | Responsive by default, accessible primitives, consistent design tokens.             |

**Decisions made without asking (per the brief's instruction to note ambiguous choices):**
- SQLite locally, PostgreSQL on Vercel — schema is identical, only the datasource provider line differs.
- iron-session instead of NextAuth — simpler for a single-app demo, no external IDP.
- Email + password only (no OAuth/MFA) — matches the explicit ask. MFA is a Phase-5 concern.
- Roles are stored as a string on `User.role` (ADMIN/TEACHER/STUDENT/PARENT/STAFF). A full RBAC
  permissions matrix (Phase 5) would add `Role` + `Permission` tables, but for Phase 2 the role
  string + server-side checks are sufficient and simpler.

---

## File structure

```
.
├── prisma/
│   └── schema.prisma              # User, Student, Teacher, Subject, Class, Enrollment, Attendance, Assignment, Grade
├── scripts/
│   └── seed.ts                    # Creates admin + 2 teachers + 5 students + classes + attendance + grades
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout, fonts, metadata
│   │   ├── page.tsx               # Server component — reads session, renders Login OR Dashboard
│   │   ├── globals.css
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts   # POST — validate creds, create session
│   │       │   ├── logout/route.ts  # POST — destroy session
│   │       │   └── me/route.ts      # GET  — current user (or null)
│   │       ├── dashboard/route.ts   # GET  — PROTECTED — role-specific dashboard data
│   │       ├── classes/route.ts     # GET  — PROTECTED — role-scoped class list
│   │       ├── attendance/route.ts  # GET + POST — PROTECTED — RBAC (teacher/admin write)
│   │       └── grades/route.ts      # GET + POST — PROTECTED — RBAC (teacher/admin write)
│   ├── components/
│   │   ├── auth/
│   │   │   └── login-form.tsx      # Client — form, validation, error display
│   │   ├── dashboard/
│   │   │   ├── dashboard.tsx       # Client — shell + role dispatch
│   │   │   └── role-views.tsx      # Student/Teacher/Admin dashboard sections
│   │   └── ui/                      # shadcn/ui primitives
│   └── lib/
│       ├── db.ts                    # Prisma client singleton
│       ├── password.ts              # bcrypt hash/verify helpers
│       ├── session.ts               # iron-session helpers (getSession, destroySession)
│       ├── auth-guard.ts            # requireAuth + requireRole helpers
│       └── validation.ts            # zod login schema + role constants
├── .env                             # Local env (gitignore in real projects)
├── .env.example                     # Template — copy to .env and edit
├── package.json
└── README.md
```

---

## Setup guide

### 1. Prerequisites
- **Node.js 18+** or **[Bun](https://bun.sh)** (recommended)
- No external database required for local dev — SQLite is a local file

### 2. Install dependencies
```bash
bun install
```

### 3. Configure environment
```bash
cp .env.example .env
```
For any real deployment, **generate a new `SESSION_SECRET`**:
```bash
openssl rand -base64 32
```

### 4. Create the database
```bash
bun run db:push
```
Creates `db/school.db` and applies the schema.

### 5. Seed sample data
```bash
bun run seed
```
Creates:
- 1 admin, 2 teachers, 5 students (all with password `password123`)
- 3 subjects, 3 classes, 15 enrollments
- 75 attendance records (last 5 weekdays × 3 classes × 5 students)
- 6 assignments + 30 grades

### 6. Run the dev server
```bash
bun run dev
```
Open <http://localhost:3000>.

---

## Test accounts

All passwords: `password123`

| Role    | Email                              | What they see                          |
| ------- | ---------------------------------- | -------------------------------------- |
| Admin   | `admin@greenfield.edu`             | School-wide stats + recent activity    |
| Teacher | `teacher.abebe@greenfield.edu`     | 2 classes (Math, Science), 10 students |
| Teacher | `teacher.sara@greenfield.edu`      | 1 class (English), 5 students          |
| Student | `student.1@greenfield.edu` ... `student.5@` | Their classes, attendance, grades |

---

## How auth + RBAC works

1. **Password storage** — bcrypt with 10 salt rounds. Never plaintext.
2. **Login** (`POST /api/auth/login`) — validates with zod, looks up user by lowercased email,
   always runs bcrypt.compare (even if email not found, to prevent timing leaks), creates
   encrypted session cookie. Returns generic "Invalid email or password" on failure.
3. **Dashboard protection** — two layers:
   - **Server render:** `src/app/page.tsx` reads the session before rendering HTML.
   - **API enforcement:** every `/api/*` route calls `requireAuth()` or `requireRole(...)`,
     returning 401/403 without a valid session/role.
4. **RBAC** — `src/lib/auth-guard.ts` provides:
   - `requireAuth()` — any logged-in user
   - `requireRole("TEACHER", "ADMIN")` — restricts to specific roles
   - Teachers can only access their own classes (verified server-side via `teacherId`).
5. **Logout** — destroys the session cookie, full page reload clears client state.

### Verified RBAC behavior
| Request                                    | Student | Teacher | Admin | Unauthenticated |
| ------------------------------------------ | ------- | ------- | ----- | --------------- |
| `GET /api/dashboard`                       | 200 (own data) | 200 (own data) | 200 (all data) | 401 |
| `GET /api/classes`                         | 200 (enrolled) | 200 (taught) | 200 (all) | 401 |
| `GET /api/grades`                          | 200 (own) | 200 (own classes) | 200 (all) | 401 |
| `POST /api/attendance`                     | **403** | 200 (own classes) | 200 | 401 |
| `POST /api/grades`                         | **403** | 200 (own classes) | 200 | 401 |

---

## Input validation

Both forms use the **same zod schema** (`src/lib/validation.ts`):

| Field      | Rules                          | Error message                          |
| ---------- | ------------------------------ | -------------------------------------- |
| `email`    | required, valid email format   | "Email is required" / "Please enter a valid email address" |
| `password` | required, min 8 characters     | "Password is required" / "Password must be at least 8 characters" |

Attendance + grades POST bodies are also zod-validated server-side.

---

## Responsiveness

- Mobile-first Tailwind breakpoints (`sm:`, `lg:`).
- Login: full-width on phones, max 28rem on desktop.
- Dashboards: 1 column on phones → 2 on tablets → 3-6 on desktops.
- Touch targets meet 44px minimum.

---

## Deploying to Vercel (Postgres)

The local SQLite DB won't work on Vercel's serverless filesystem. To deploy:

1. **Get a Postgres database** — Vercel Postgres (built-in), Neon, or Supabase.
2. **Change the Prisma provider** in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   # was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. **Add `postinstall` to `package.json`:**
   ```json
   "scripts": {
     "postinstall": "prisma generate",
     ...
   }
   ```
4. **Set Vercel env vars:**
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://user:pass@host:port/db?schema=public` |
   | `SESSION_SECRET` | 32+ char random string (`openssl rand -base64 32`) |
   | `SESSION_TTL_SECONDS` | `86400` |
5. **Push schema + seed the hosted DB** (locally, with `DATABASE_URL` pointing at Postgres):
   ```bash
   DATABASE_URL="postgresql://..." bun run db:push
   DATABASE_URL="postgresql://..." bun run seed
   ```
6. Deploy.

---

## Common tasks

| Task                      | Command                |
| ------------------------- | ---------------------- |
| Install dependencies      | `bun install`          |
| Create / reset DB schema  | `bun run db:push`      |
| Seed sample data          | `bun run seed`         |
| Start dev server          | `bun run dev`          |
| Lint                      | `bun run lint`         |
| Open DB GUI               | `bun run db:studio`    |

---

## What's next (roadmap, not in this build)

Per the architecture document:

- **Phase 3 — Campus operations:** cafeteria inventory + meal service, dormitory room/bed assignments, maintenance requests
- **Phase 4 — Administration:** parents, fee management, admissions workflow, notifications
- **Phase 5 — Hardening:** MFA, audit logs, rate limiting, backups, full RBAC permissions matrix, accessibility audit

Each phase adds Prisma models + new API route handlers + new dashboard sections — all gated by the same `requireAuth()` / `requireRole()` checks used here.
