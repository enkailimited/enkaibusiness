"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addLeadActivityAction } from "../actions";

interface LeadActivityFormProps {
  leadId: string;
}

export function LeadActivityForm({ leadId }: LeadActivityFormProps) {
  const action = addLeadActivityAction;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Activity</CardTitle>
        <CardDescription>Record a new activity for this lead</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="leadId" value={leadId} />

          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <select
              id="action"
              name="action"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="CALL">Phone Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="DEMO">Product Demo</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="NOTE">Note</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail">Detail</Label>
            <Input id="detail" name="detail" />
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
            {pending ? "Adding..." : "Add Activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
