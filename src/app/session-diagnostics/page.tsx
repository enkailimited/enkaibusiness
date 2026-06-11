"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SessionDiagnosticsPage() {
  const { data: session, isPending, error: sessionError, refetch } = useSession();
  const [cookieInfo, setCookieInfo] = useState<Record<string, string | null>>({});
  const [serverSession, setServerSession] = useState<unknown>(null);
  const [serverLoading, setServerLoading] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, ...rest] = cookie.split("=");
      if (key) acc[key.trim()] = rest.join("=") || null;
      return acc;
    }, {} as Record<string, string | null>);
    setCookieInfo(cookies);
  }, []);

  async function checkServerSession() {
    setServerLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setServerSession(data);
    } catch (err) {
      setServerSession({ error: err instanceof Error ? err.message : "Failed to fetch" });
    } finally {
      setServerLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Session Diagnostics</CardTitle>
          <CardDescription>Inspect your current session state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Better Auth Client Session</h3>
            {isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading session...
              </div>
            ) : sessionError ? (
              <div className="text-sm text-red-600">Error: {sessionError.message}</div>
            ) : (
              <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Cookies</h3>
            <pre className="overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(cookieInfo, null, 2)}
            </pre>
            <p className="mt-1 text-xs text-muted-foreground">
              Session cookie present: {cookieInfo["enkai-session-token"] ? "Yes" : "No"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Server Session Check</h3>
            <Button onClick={checkServerSession} disabled={serverLoading} variant="outline" size="sm">
              {serverLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Server Session
            </Button>
            {serverSession !== null && (
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(serverSession, null, 2) as string}
              </pre>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Quick Actions</h3>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Refresh Client Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
