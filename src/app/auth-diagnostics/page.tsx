"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface DiagnosticResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "pass" | "fail" | "warn"; message: string; details?: unknown }>;
  timestamp: string;
}

export default function AuthDiagnosticsPage() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDiagnostics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/health");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run diagnostics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Auth Diagnostics</CardTitle>
          <CardDescription>Run system checks to verify authentication is working correctly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Running..." : "Run Diagnostics"}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 text-sm font-medium ${
                result.status === "healthy" ? "bg-green-50 text-green-800 border border-green-200" :
                result.status === "degraded" ? "bg-yellow-50 text-yellow-800 border border-yellow-200" :
                "bg-red-50 text-red-800 border border-red-200"
              }`}>
                Overall Status: {result.status.toUpperCase()}
              </div>

              {(Object.entries(result.checks) as Array<[string, { status: string; message: string; details?: Record<string, unknown> }]>).map(([key, check]) => (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    {check.status === "pass" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : check.status === "warn" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className={`ml-auto text-xs ${
                      check.status === "pass" ? "text-green-600" :
                      check.status === "warn" ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{check.message}</p>
                  {check.details && (
                    <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Run at: {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
