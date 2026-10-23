"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Loader2,
  LogIn,
  AlertCircle,
  BookOpen,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateField(field: "email" | "password", value: string) {
    const partial = loginSchema.shape[field].safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: partial.success ? undefined : partial.error.issues[0].message,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as "email" | "password" | undefined;
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error ?? "Unable to sign in. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setFormError("Network error — please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ────────────────────────────────────────────────────────────────────
          Left brand panel (desktop only)
          School group photo background + emerald gradient overlay + value props.
         ──────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Background photo of students on campus */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/school-bg.jpg)" }}
        />
        {/* Emerald gradient overlay for brand cohesion + text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-teal-800/75 to-cyan-900/85" />
        {/* Animated floating blobs (subtle, on top of photo) */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-cyan-300/15 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold leading-tight">Greenfield Academy</p>
              <p className="text-xs text-white/70 leading-tight">School Portal</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              One portal for your entire school community.
            </h1>
            <p className="mt-4 text-white/80 leading-relaxed">
              Students, teachers, and administrators sign in to a dashboard
              tailored to their role — grades, attendance, classes, and
              announcements, all in one place.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: BookOpen, text: "Role-specific dashboards for every user" },
                { icon: Users, text: "Connected academic records across departments" },
                { icon: ShieldCheck, text: "Secure, session-protected access" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/90">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Greenfield Academy. All rights reserved.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          Right form panel
         ──────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/30">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand header */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight">
              Greenfield Academy
            </h1>
            <p className="text-sm text-muted-foreground">School Portal</p>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-emerald-900/5 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {formError && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@greenfield.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) validateField("email", e.target.value);
                  }}
                  onBlur={(e) => validateField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={submitting}
                  required
                  className="h-11 rounded-xl bg-white/70 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateField("password", e.target.value);
                  }}
                  onBlur={(e) => validateField("password", e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  disabled={submitting}
                  required
                  className="h-11 rounded-xl bg-white/70 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-colors"
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-medium text-emerald-700">Demo accounts</span>{" "}
                (password{" "}
                <code className="font-mono bg-white/60 px-1 rounded">
                  password123
                </code>
                ):
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                <code className="font-mono">admin@greenfield.edu</code>
                <code className="font-mono">teacher.abebe@greenfield.edu</code>
                <code className="font-mono">student.1@greenfield.edu</code>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are issued by the school administration.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
