"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assignLeadAction } from "../actions";

interface LeadAssignmentFormProps {
  leadId: string;
  salesProfiles: { id: string; name: string }[];
}

export function LeadAssignmentForm({ leadId, salesProfiles }: LeadAssignmentFormProps) {
  const [state, formAction, pending] = useActionState(assignLeadAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assign Lead</CardTitle>
        <CardDescription>Assign this lead to a sales profile</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="leadId" value={leadId} />

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Sales Profile</Label>
            <select
              id="assignedToId"
              name="assignedToId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select a profile</option>
              {salesProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" />
          </div>

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>{field}: {msgs.join(", ")}</p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Assigning..." : "Assign Lead"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
