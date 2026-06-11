"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createQRCodesAction } from "../actions";

interface QRCodeFormProps {
  campaignId: string;
}

export function QRCodeForm({ campaignId }: QRCodeFormProps) {
  const [state, formAction, pending] = useActionState(createQRCodesAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate QR Codes</CardTitle>
        <CardDescription>Create new QR codes for this campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="campaignId" value={campaignId} />

          <div className="space-y-2">
            <Label htmlFor="count">Number of QR Codes</Label>
            <Input
              id="count"
              name="count"
              type="number"
              min={1}
              max={1000}
              defaultValue={10}
              required
            />
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Generating..." : "Generate QR Codes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
