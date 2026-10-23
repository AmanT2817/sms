"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  Loader2,
  Calendar,
  Mail,
  FileText,
  Clock,
  Megaphone,
  Users,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

interface DashboardData {
  user: DashboardUser;
  stats: { totalAccounts: number; term: string; schoolName: string };
  announcements: Announcement[];
  quickActions: QuickAction[];
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  mail: Mail,
  form: FileText,
  date: Clock,
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        // Session invalid or expired — bounce back to login view.
        setData(null);
        router.refresh();
        return;
      }
      if (!res.ok) {
        setError("Could not load dashboard. Please try again.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setData(null);
      router.refresh();
      // Force a full reload so all cached client state is cleared.
      window.location.href = "/";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDashboard} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null; // 401 path — router.refresh will swap view to login.

  const { user, stats, announcements, quickActions } = data;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">
                {stats.schoolName}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                School Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Mobile user badge */}
        <div className="sm:hidden flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">
              {user.email}
            </p>
          </div>
        </div>

        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {greeting}, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground">
              You are signed in as{" "}
              <Badge variant="secondary" className="font-normal">
                {user.roleLabel}
              </Badge>{" "}
              · {stats.term}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                School accounts
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats.totalAccounts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered portal users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current term
              </CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stats.term}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active academic period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                local time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Announcements */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base">Announcements</CardTitle>
              </div>
              <CardDescription>
                Latest news from the school office.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((a) => (
                <article
                  key={a.id}
                  className="border-l-2 border-emerald-200 pl-3 py-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{a.title}</h3>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                </article>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Shortcuts for common tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = ACTION_ICONS[action.icon] ?? FileText;
                return (
                  <button
                    key={action.id}
                    type="button"
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-background p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors min-h-[88px]"
                  >
                    <Icon className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Megaphone className="h-4 w-4" />
          <AlertDescription>
            This is a Phase 1 foundation build — login, session-protected
            dashboard, and logout. Role-specific modules (academics, dormitory,
            cafeteria, finance) plug into this shell in later phases.
          </AlertDescription>
        </Alert>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {stats.schoolName}</span>
          <span>Signed in as {user.email}</span>
        </div>
      </footer>
    </div>
  );
}
