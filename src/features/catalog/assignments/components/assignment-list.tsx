"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssignmentWithRelations } from "../types";

interface AssignmentListProps {
  assignments: AssignmentWithRelations[];
  onRemove?: (assignmentId: string) => void;
}

export function AssignmentList({ assignments, onRemove }: AssignmentListProps) {
  if (!assignments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assignments configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Assignments ({assignments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant={assignment.isAvailable ? "success" : "secondary"}>
                  {assignment.isAvailable ? "Available" : "Unavailable"}
                </Badge>
                <div>
                  {assignment.branch && (
                    <p className="text-sm font-medium">
                      Branch: {assignment.branch.name}
                    </p>
                  )}
                  {assignment.store && (
                    <p className="text-sm font-medium">
                      Store: {assignment.store.name}
                    </p>
                  )}
                  {!assignment.branch && !assignment.store && (
                    <p className="text-sm text-muted-foreground">All locations</p>
                  )}
                </div>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(assignment.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
