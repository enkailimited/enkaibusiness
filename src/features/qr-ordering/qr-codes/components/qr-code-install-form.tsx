"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { installQRCodeAction } from "../actions";

interface QRCodeInstallFormProps {
  qrCodeId: string;
  businessId: string;
}

export function QRCodeInstallForm({ qrCodeId, businessId }: QRCodeInstallFormProps) {
  const [state, formAction, pending] = useActionState(installQRCodeAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install QR Code</CardTitle>
        <CardDescription>Record installation details for this QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="qrCodeId" value={qrCodeId} />
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g. Front counter" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional installation notes" />
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Installing..." : "Install QR Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
