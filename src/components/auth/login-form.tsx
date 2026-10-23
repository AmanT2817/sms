"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

    // Client-side validation (mirrors server) — instant feedback.
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
        // Show the server's safe error message (e.g. "Invalid email or password").
        setFormError(data?.error ?? "Unable to sign in. Please try again.");
        return;
      }

      // Brief router refresh so the server component re-evaluates the session
      // and swaps this Login view for the Dashboard.
      router.refresh();
    } catch {
      setFormError("Network error — please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Greenfield Academy
          </h1>
          <p className="text-sm text-muted-foreground">School Portal</p>
        </div>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your school email and password to access your dashboard.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@school.edu"
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
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                  aria-describedby={errors.password ? "password-error" : undefined}
                  disabled={submitting}
                  required
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
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
              <p className="text-xs text-center text-muted-foreground px-2">
                Test account: <code className="font-mono">admin@greenfield.edu</code> /{" "}
                <code className="font-mono">password123</code>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Greenfield Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
