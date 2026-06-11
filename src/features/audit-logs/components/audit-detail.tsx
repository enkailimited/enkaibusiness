"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditLogWithUser } from "../types";

interface AuditDetailProps {
  log: AuditLogWithUser;
}

function DiffView({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const allKeys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];

  if (allKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No state changes recorded</p>;
  }

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const beforeVal = before ? JSON.stringify(before[key]) : undefined;
        const afterVal = after ? JSON.stringify(after[key]) : undefined;
        const changed = beforeVal !== afterVal;

        return (
          <div key={key} className="grid grid-cols-3 gap-2 text-sm py-1 border-b last:border-b-0">
            <span className="font-medium text-muted-foreground">{key}</span>
            <span className={changed ? "text-destructive line-through" : "text-muted-foreground"}>
              {beforeVal ?? "-"}
            </span>
            <span className={changed ? "text-green-600" : "text-muted-foreground"}>
              {afterVal ?? "-"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AuditDetail({ log }: AuditDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg capitalize">{log.action}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {log.user.firstName} {log.user.lastName ?? ""} &mdash; {log.resourceType} / {log.resourceId.slice(0, 8)}...
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {log.action}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {log.ipAddress && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">IP Address</span>
              <p className="text-sm font-mono">{log.ipAddress}</p>
            </div>
          )}
          {log.userAgent && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">User Agent</span>
              <p className="text-sm truncate" title={log.userAgent}>{log.userAgent}</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">State Changes</h4>
          <DiffView
            before={(log.before ?? {}) as Record<string, unknown>}
            after={(log.after ?? {}) as Record<string, unknown>}
          />
        </div>
      </CardContent>
    </Card>
  );
}
