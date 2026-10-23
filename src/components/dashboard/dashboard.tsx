"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogOut, GraduationCap, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Sidebar } from "./sidebar";
import {
  AdminDashboardSection,
  StudentDashboardSection,
  TeacherDashboardSection,
  type DashboardData,
} from "./role-views";
import { ThemeToggle } from "@/components/theme-toggle";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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
      window.location.href = "/";
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-2xl border-2 border-emerald-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ borderTopColor: "rgba(16, 185, 129, 0.8)" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDashboard} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { user, stats } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-background via-background to-emerald-50/30 dark:to-emerald-950/10 overflow-x-hidden">
      <Sidebar
        user={user}
        schoolName={stats.schoolName}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-background/80 backdrop-blur-xl border-b border-border items-center justify-between px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students, classes, assignments…"
                className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </Button>
            <ThemeToggle />
            <div className="h-6 w-px bg-border mx-1" />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-medium">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">{user.roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Greeting header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {greeting}, {user.name.split(" ")[0]}!
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  <Badge variant="secondary" className="font-normal mr-2">
                    {user.roleLabel}
                  </Badge>
                  {stats.term}
                </p>
              </div>
              {/* Mobile logout (sidebar handles it on desktop) */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                className="lg:hidden self-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </motion.div>

            {/* Role-specific content with page transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={user.role}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {user.role === "STUDENT" && data.student && <StudentDashboardSection data={data} />}
                {user.role === "TEACHER" && data.teacher && <TeacherDashboardSection data={data} />}
                {user.role === "ADMIN" && data.admin && <AdminDashboardSection data={data} />}
                {!data.student && !data.teacher && !data.admin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Welcome</CardTitle>
                      <CardDescription>
                        Your role ({user.roleLabel}) doesn&apos;t have a specific dashboard yet.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
