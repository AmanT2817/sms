# Greenfield Academy — School Portal (Phase 1)

A working school website with a **login page**, a session-protected **dashboard**, and **logout**.
Built as Phase 1 of the broader School Management System architecture: identity, authentication,
and a personalized dashboard shell. Later phases (academics, dormitory, cafeteria, finance)
plug into this foundation.

> Scope of this build: login → dashboard → logout. Role-specific modules (students, teachers,
> dormitory, cafeteria, finance) are explicitly out of scope for this deliverable and would be
> added as separate route handlers + dashboard sections in later phases.

---

## Stack & why

| Layer        | Choice                          | Why                                                                                  |
| ------------ | ------------------------------- | ------------------------------------------------------------------------------------ |
| Framework    | **Next.js 16 (App Router) + TypeScript** | Mainstream, well-documented, single-language full stack. The user-facing route is server-rendered, so session checks happen before any HTML reaches the browser. |
| Database     | **SQLite via Prisma ORM**       | Zero-config local DB (no separate server to install). Prisma gives typed access and migrations. Swap the `DATABASE_URL` for PostgreSQL in production — schema is portable. |
| Auth         | **iron-session** (encrypted cookie) + **bcryptjs** | Signed/encrypted session cookies — no external session store required. bcrypt is the industry-standard password hash. Passwords are never stored in plaintext. |
| Validation   | **zod**                         | Same schema reused on client (instant feedback) and server (authoritative).          |
| UI           | **Tailwind CSS + shadcn/ui**    | Responsive by default, accessible primitives, consistent design tokens.             |

**Decisions made without asking (per the brief's instruction to note ambiguous choices):**
- SQLite instead of PostgreSQL → so the project runs locally with zero external services. Schema is portable; only `DATABASE_URL` needs to change for prod.
- iron-session instead of NextAuth → simpler for a single-app demo, no external IDP needed.
- Email + password only (no OAuth/MFA) → matches the explicit ask. The architecture doc lists MFA as a Phase-5 concern.
- Single `/` route → the dev sandbox only exposes `/`. The same code works as `/portal/login` and `/portal/dashboard` if you split routes later.

---

## File structure

```
.
├── prisma/
│   └── schema.prisma              # User model (id, email, name, role, passwordHash)
├── scripts/
│   └── seed.ts                    # Creates the test account (idempotent upsert)
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
│   │       └── dashboard/route.ts   # GET  — PROTECTED — dashboard data
│   ├── components/
│   │   ├── auth/
│   │   │   └── login-form.tsx      # Client — form, validation, error display
│   │   ├── dashboard/
│   │   │   └── dashboard.tsx       # Client — fetches /api/dashboard, renders shell
│   │   └── ui/                      # shadcn/ui primitives (button, card, input, ...)
│   └── lib/
│       ├── db.ts                    # Prisma client singleton
│       ├── password.ts              # bcrypt hash/verify helpers
│       ├── session.ts               # iron-session helpers (getSession, destroySession)
│       └── validation.ts            # zod login schema + role constants
├── .env                             # Local env (gitignore this in real projects)
├── .env.example                     # Template — copy to .env and edit
├── package.json
└── README.md
```

---

## Setup guide

### 1. Prerequisites

- **Node.js 18+** or **[Bun](https://bun.sh)** (recommended — faster, used in these instructions)
- No external database required — SQLite is a local file

### 2. Install dependencies

```bash
bun install
```

(Or with npm: `npm install`)

### 3. Configure environment

Copy the template and edit if you want to change the session secret:

```bash
cp .env.example .env
```

The defaults work for local dev. For any real deployment, **generate a new `SESSION_SECRET`**:

```bash
openssl rand -base64 32
```

Paste it into `.env` as `SESSION_SECRET`.

### 4. Create the database

```bash
bun run db:push
```

This creates `db/school.db` (a SQLite file) and applies the schema in `prisma/schema.prisma`.

### 5. Seed the test account

```bash
bun run seed
```

Output confirms the account is ready:

```
✓ Test account ready:
   email    : admin@greenfield.edu
   name     : Ada Admin
   role     : ADMIN
   password : password123 (hashed in DB — never stored in plaintext)
```

The seed is **idempotent** — running it again updates the password hash in place. It does not delete other users.

### 6. Run the dev server

```bash
bun run dev
```

Open <http://localhost:3000> in your browser. You should see the login page.

Sign in with the test account:

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@greenfield.edu` |
| Password | `password123`          |

You land on the dashboard. Click **Sign out** to return to the login page.

### 7. (Optional) Inspect the database

```bash
bun run db:studio
```

Opens Prisma Studio at <http://localhost:5555> — a GUI for browsing the `User` table.

---

## How auth works (security notes)

1. **Password storage** — `bcrypt` with 10 salt rounds. The DB column `passwordHash` never contains plaintext. See `src/lib/password.ts`.
2. **Login flow** (`POST /api/auth/login`):
   - Server validates the body with the same zod schema the client uses.
   - Looks up the user by lowercased email.
   - Runs `bcrypt.compare` against the stored hash — and **always runs a comparison** even if the email wasn't found, so response timing can't leak which emails exist.
   - On success, writes `userId`, `email`, `name`, `role` into an encrypted iron-session cookie. **The password hash never enters the cookie.**
   - On failure, returns 401 with the generic message `"Invalid email or password"` — never tells the visitor whether the email or the password was wrong.
3. **Dashboard protection** — two layers:
   - **Server render:** `src/app/page.tsx` is a Server Component. It reads the session before rendering. An unauthenticated visitor gets the `LoginForm`, never the `Dashboard` component tree.
   - **API enforcement:** `GET /api/dashboard` independently re-checks the session and returns 401 if absent. Even a hand-crafted `fetch('/api/dashboard')` from the browser fails without a valid cookie.
4. **Logout** — `POST /api/auth/logout` calls `session.destroy()`, which removes the cookie. The client then does a full `window.location.href = "/"` to clear any in-memory state.
5. **Cookie flags** — `httpOnly: true` (no JS access — mitigates XSS token theft), `sameSite: "lax"` (mitigates CSRF for top-level navigations), `secure: true` in production.

---

## Input validation

Both forms are validated with the **same zod schema** (`src/lib/validation.ts`):

| Field    | Rules                                              | Error message                          |
| -------- | -------------------------------------------------- | -------------------------------------- |
| `email`  | required, must be a valid email                    | "Email is required" / "Please enter a valid email address" |
| `password` | required, min 8 characters                       | "Password is required" / "Password must be at least 8 characters" |

- **Client** validates on blur and on submit, showing inline field errors.
- **Server** re-runs the same schema on every POST — the client is never trusted.

---

## Responsiveness

- Mobile-first Tailwind breakpoints (`sm:`, `lg:`).
- Login card: full-width on phones, max 28rem on desktop, centered with vertical padding.
- Dashboard: 1 column on phones → 2 columns on tablets → 3 columns on desktops. The header collapses the user info on small screens; a compact user badge appears in the main content area instead.
- Touch targets meet the 44px minimum (buttons, action cards).

---

## Try the bad-credentials path

1. Open the login page.
2. Enter `wrong@greenfield.edu` and any password.
3. You should see a red alert: **"Invalid email or password"**.
4. Try an invalid email format (e.g. `notanemail`) — you should see inline field validation: **"Please enter a valid email address"**.
5. Try a password shorter than 8 chars — you should see **"Password must be at least 8 characters"**.

---

## Common tasks

| Task                      | Command                |
| ------------------------- | ---------------------- |
| Install dependencies      | `bun install`          |
| Create / reset DB schema  | `bun run db:push`      |
| Seed test account         | `bun run seed`         |
| Start dev server          | `bun run dev`          |
| Lint                      | `bun run lint`         |
| Open DB GUI               | `bun run db:studio`    |

---

## What's next (roadmap, not in this build)

Per the architecture document, later phases plug into this shell:

- **Phase 2 — Academic core:** students, teachers, classes, attendance, grades
- **Phase 3 — Campus operations:** cafeteria, dormitory, maintenance
- **Phase 4 — Administration:** parents, fees, admissions, notifications
- **Phase 5 — Hardening:** MFA, audit logs, rate limiting, backups, accessibility audit

Each phase adds Prisma models + new API route handlers + new dashboard sections — all gated by the same session check used here.
