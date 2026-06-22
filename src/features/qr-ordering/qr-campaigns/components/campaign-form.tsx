"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampaignAction } from "../actions";

export function CampaignForm() {
  const [state, formAction, pending] = useActionState(createCampaignAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Campaign</CardTitle>
        <CardDescription>Set up a new QR code distribution campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" name="name" placeholder="e.g. Summer 2025 Distribution" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="description" name="description" placeholder="Optional description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalQRCodes">Total QR Codes</Label>
            <Input id="totalQRCodes" name="totalQRCodes" type="number" min={0} defaultValue={0} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="datetime-local" />
            </div>
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
