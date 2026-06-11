"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assignQRCodeAction } from "../actions";

interface QRCodeAssignFormProps {
  qrCodeIds: string[];
}

export function QRCodeAssignForm({ qrCodeIds }: QRCodeAssignFormProps) {
  const [state, formAction, pending] = useActionState(assignQRCodeAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign QR Codes</CardTitle>
        <CardDescription>Assign {qrCodeIds.length} QR code(s) to a person or entity</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="qrCodeIds" value={JSON.stringify(qrCodeIds)} />

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Input id="assignedTo" name="assignedTo" placeholder="Person or entity ID" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional notes" />
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Assigning..." : "Assign QR Codes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
