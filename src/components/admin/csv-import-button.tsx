"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportResult {
  row: number;
  email: string;
  status: "created" | "updated" | "error";
  message: string;
  password?: string;
}

interface ImportResponse {
  summary: {
    total: number;
    created: number;
    updated: number;
    errors: number;
  };
  results: ImportResult[];
}

const SAMPLE_CSV = `email,name,role,gradeLevel,admissionNumber,guardianName,guardianPhone,employeeId,department
student.6@greenfield.edu,Marta Tadesse,STUDENT,Grade 10,ADM-2025-006,Tadesse Bekele,+251 911 000 006,,
student.7@greenfield.edu,Solomon Girma,STUDENT,Grade 10,ADM-2025-007,Girma Haile,+251 911 000 007,,
teacher.david@greenfield.edu,David Alemu,TEACHER,,,,,EMP-003,Science
staff.maria@greenfield.edu,Maria Solomon,STAFF,,,,,,
`;

export function CsvImportButton() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function downloadSampleCsv() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "greenfield-users-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setResult(null);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Import failed.");
        return;
      }
      setResult(data as ImportResponse);
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset state after the dialog closes
    setTimeout(() => {
      setResult(null);
      setError(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Bulk import users
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create or update multiple user accounts at once.
            All imported users get the default password{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
              password123
            </code>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sample CSV download */}
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Not sure of the format?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download the template to see the expected columns and example rows.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={downloadSampleCsv}
                className="shrink-0"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Template
              </Button>
            </div>
          </div>

          {/* File input */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="csv-file">
              CSV file
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileSelected}
                className="block w-full text-sm text-muted-foreground
                  file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                  file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700
                  dark:file:bg-emerald-950/40 dark:file:text-emerald-300
                  hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/40
                  file:cursor-pointer file:transition-colors
                  border border-border rounded-lg bg-background/60"
              />
            </div>
            {fileName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {fileName}
              </p>
            )}
          </div>

          {/* Required columns hint */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium hover:text-foreground">
              Required &amp; optional columns
            </summary>
            <div className="mt-2 space-y-1 pl-3">
              <p><span className="font-mono">email</span> — required, must be valid</p>
              <p><span className="font-mono">name</span> — required</p>
              <p><span className="font-mono">role</span> — required: ADMIN | TEACHER | STAFF | STUDENT | PARENT</p>
              <p className="text-muted-foreground/70">Optional (students): gradeLevel, admissionNumber, guardianName, guardianPhone</p>
              <p className="text-muted-foreground/70">Optional (teachers): employeeId, department</p>
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={uploading}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !fileName}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {fileName ? `${fileName}` : ""}
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {result.summary.created}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {result.summary.updated}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50/60 dark:bg-red-950/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Errors</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {result.summary.errors}
                    </p>
                  </div>
                </div>

                {/* Per-row results */}
                <div className="rounded-xl border border-border/60 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Row</th>
                        <th className="text-left p-2 font-medium">Email</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {result.results.map((r, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="p-2 text-muted-foreground">{r.row}</td>
                          <td className="p-2 font-mono truncate max-w-[180px]">{r.email}</td>
                          <td className="p-2">
                            {r.status === "created" && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Created
                              </span>
                            )}
                            {r.status === "updated" && (
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Updated
                              </span>
                            )}
                            {r.status === "error" && (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="h-3 w-3" />
                                Error
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  All imported users can sign in with{" "}
                  <code className="font-mono bg-muted px-1 rounded">password123</code>. They should
                  change it after first login (password change feature is coming in a later phase).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
