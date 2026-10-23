"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Megaphone,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AnimatedCounter,
  ProgressRing,
  StaggerContainer,
  StaggerItem,
  GlassCard,
} from "@/components/ui/animated";
import { CsvImportButton } from "@/components/admin/csv-import-button";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
}
interface Announcement { id: string; title: string; body: string; date: string; }

export interface DashboardData {
  user: DashboardUser;
  stats: { term: string; schoolName: string };
  announcements: Announcement[];
  student?: StudentData;
  teacher?: TeacherData;
  admin?: AdminData;
}

interface StudentData {
  admissionNumber: string;
  gradeLevel: string;
  guardianName: string | null;
  classes: {
    id: string; name: string; subject: string; teacher: string;
    academicYear: string; term: string;
  }[];
  attendanceSummary: {
    rate: number; totalRecords: number; present: number;
    recent: { id: string; date: string; status: string; subject: string }[];
  };
  grades: {
    id: string; title: string; subject: string;
    score: number; maxScore: number; percentage: number;
  }[];
  averageScore: number | null;
  upcomingAssignments: {
    id: string; title: string; subject: string;
    dueDate: string; maxScore: number;
  }[];
}

interface TeacherData {
  employeeId: string;
  department: string | null;
  classes: {
    id: string; name: string; subject: string;
    academicYear: string; term: string; studentCount: number;
  }[];
  assignmentsToGrade: {
    id: string; title: string; subject: string; className: string;
    dueDate: string; maxScore: number; gradedCount: number;
  }[];
  totalStudents: number;
}

interface AdminData {
  stats: {
    totalAccounts: number; totalStudents: number; totalTeachers: number;
    totalClasses: number; totalAssignments: number; totalGrades: number;
    term: string; schoolName: string;
  };
  recentActivity: {
    id: string; studentName: string; subject: string;
    date: string; status: string;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ABSENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  EXCUSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
  accent?: "emerald" | "cyan" | "amber" | "violet";
}) {
  const accentMap = {
    emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400",
    cyan: "from-cyan-500/10 to-blue-500/5 text-cyan-600 dark:text-cyan-400",
    amber: "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400",
    violet: "from-violet-500/10 to-purple-500/5 text-violet-600 dark:text-violet-400",
  };
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassCard>
  );
}

function AnnouncementsCard({ announcements }: { announcements: Announcement[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Announcements</h3>
          <p className="text-xs text-muted-foreground">Latest from the school office</p>
        </div>
      </div>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {announcements.map((a, i) => (
          <motion.article
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="border-l-2 border-emerald-300/60 dark:border-emerald-700/60 pl-3 py-1"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-medium">{a.title}</h4>
              <time className="text-[11px] text-muted-foreground whitespace-nowrap">
                {new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </time>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{a.body}</p>
          </motion.article>
        ))}
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Student dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function StudentDashboardSection({ data }: { data: DashboardData }) {
  const s = data.student!;
  return (
    <StaggerContainer className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Attendance"
            value={<AnimatedCounter value={s.attendanceSummary.rate} suffix="%" />}
            sub={`${s.attendanceSummary.present}/${s.attendanceSummary.totalRecords} days`}
            icon={ClipboardCheck}
            accent="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Average"
            value={s.averageScore !== null ? <AnimatedCounter value={s.averageScore} suffix="%" /> : "—"}
            sub="All assignments"
            icon={TrendingUp}
            accent="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Classes"
            value={<AnimatedCounter value={s.classes.length} />}
            sub={s.gradeLevel}
            icon={BookOpen}
            accent="violet"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Due soon"
            value={<AnimatedCounter value={s.upcomingAssignments.length} />}
            sub="Assignments"
            icon={Clock}
            accent="amber"
          />
        </StaggerItem>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance ring + classes */}
        <StaggerItem>
          <GlassCard className="p-5 h-full">
            <div className="flex flex-col items-center text-center">
              <h3 className="font-semibold text-sm mb-4">Attendance Overview</h3>
              <ProgressRing
                value={s.attendanceSummary.rate}
                size={140}
                label={`${s.attendanceSummary.rate}%`}
                sublabel="Present"
              />
              <div className="mt-4 grid grid-cols-2 gap-2 w-full text-xs">
                <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 p-2">
                  <p className="text-muted-foreground">Present</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{s.attendanceSummary.present}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{s.attendanceSummary.totalRecords}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        {/* My classes */}
        <StaggerItem>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-sm">My Classes</h3>
            </div>
            <div className="space-y-3">
              {s.classes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-purple-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Upcoming assignments */}
        <StaggerItem>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Upcoming</h3>
            </div>
            <div className="space-y-3">
              {s.upcomingAssignments.length === 0 && (
                <p className="text-sm text-muted-foreground">All caught up!</p>
              )}
              {s.upcomingAssignments.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subject}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                    {new Date(a.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>
      </div>

      {/* Recent grades + announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaggerItem>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-sm">Recent Grades</h3>
            </div>
            <div className="space-y-3">
              {s.grades.length === 0 && <p className="text-sm text-muted-foreground">No grades yet.</p>}
              {s.grades.slice(0, 6).map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{g.title}</p>
                    <p className="text-xs text-muted-foreground">{g.subject}</p>
                  </div>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        g.percentage >= 80 ? "bg-emerald-500" : g.percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-right w-16 shrink-0">
                    <p className="text-sm font-semibold">{g.score}/{g.maxScore}</p>
                    <p className={`text-xs ${g.percentage >= 80 ? "text-emerald-600 dark:text-emerald-400" : g.percentage >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {g.percentage}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <AnnouncementsCard announcements={data.announcements} />
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherDashboardSection({ data }: { data: DashboardData }) {
  const t = data.teacher!;
  return (
    <StaggerContainer className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard
            label="My Classes"
            value={<AnimatedCounter value={t.classes.length} />}
            sub={t.department ?? "—"}
            icon={BookOpen}
            accent="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Students"
            value={<AnimatedCounter value={t.totalStudents} />}
            sub="Across all classes"
            icon={Users}
            accent="cyan"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="To Grade"
            value={<AnimatedCounter value={t.assignmentsToGrade.length} />}
            sub="Assignments"
            icon={ClipboardCheck}
            accent="amber"
          />
        </StaggerItem>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My classes — detailed cards */}
        <StaggerItem>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-sm">My Classes</h3>
            </div>
            <div className="space-y-3">
              {t.classes.map((c) => (
                <motion.div
                  key={c.id}
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-emerald-300/60 dark:hover:border-emerald-700/60 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject} · {c.term}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <Users className="h-3 w-3 mr-1" />
                    {c.studentCount}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>

        {/* Grading queue */}
        <StaggerItem>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-sm">Grading Queue</h3>
            </div>
            <div className="space-y-3">
              {t.assignmentsToGrade.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing to grade right now.</p>
              )}
              {t.assignmentsToGrade.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-border/60 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.className} · /{a.maxScore}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap shrink-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(a.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">{a.gradedCount} graded</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>
      </div>

      <StaggerItem>
        <AnnouncementsCard announcements={data.announcements} />
      </StaggerItem>
    </StaggerContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin dashboard
// ─────────────────────────────────────────────────────────────────────────────

export function AdminDashboardSection({ data }: { data: DashboardData }) {
  const a = data.admin!;
  return (
    <StaggerContainer className="space-y-6">
      {/* Animated counter stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StaggerItem>
          <StatCard label="Users" value={<AnimatedCounter value={a.stats.totalAccounts} />} icon={Users} accent="emerald" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Students" value={<AnimatedCounter value={a.stats.totalStudents} />} icon={GraduationCap} accent="cyan" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Teachers" value={<AnimatedCounter value={a.stats.totalTeachers} />} icon={BookOpen} accent="violet" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Classes" value={<AnimatedCounter value={a.stats.totalClasses} />} icon={Calendar} accent="amber" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Assignments" value={<AnimatedCounter value={a.stats.totalAssignments} />} icon={FileText} accent="emerald" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Grades" value={<AnimatedCounter value={a.stats.totalGrades} />} icon={TrendingUp} accent="cyan" />
        </StaggerItem>
      </div>

      {/* Admin quick actions bar */}
      <StaggerItem>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-3">
          <div>
            <p className="text-sm font-medium">User administration</p>
            <p className="text-xs text-muted-foreground">
              Add a single user or import many from a CSV file.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvImportButton />
          </div>
        </div>
      </StaggerItem>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <StaggerItem>
          <GlassCard className="p-5 h-full lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Recent Attendance Activity</h3>
                <p className="text-xs text-muted-foreground">Latest records across the school</p>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {a.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
              {a.recentActivity.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.subject} · {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem>
          <AnnouncementsCard announcements={data.announcements} />
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
