"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2 } from "lucide-react";
import { createQRExperienceAction } from "@/features/qr/actions";
import { QR_MODES_BY_INDUSTRY } from "@/features/qr/services/qr-service";

export default function NewQRExperiencePage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createQRExperienceAction, null);
  const [businesses, setBusinesses] = useState<{ id: string; name: string; industry?: string }[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/businesses?select=id,name,industry")
      .then((r) => r.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/platform/sales-team/qr/${state.data.id}`);
    }
  }, [state, router]);

  const business = businesses.find((b) => b.id === selectedBusiness);
  const modes = business?.industry
    ? QR_MODES_BY_INDUSTRY[business.industry] || QR_MODES_BY_INDUSTRY.COMMERCE
    : [];

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <PageHeader title="New QR Experience" description="Create a QR code for a business experience" />

      <form action={action} className="space-y-6 border rounded-lg p-6 bg-card">
        {state?.message && !state?.success && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
        )}

        {state?.success && state.data?.code && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md text-center">
            <p className="text-green-800 font-bold text-lg">{state.data.code}</p>
            <p className="text-sm text-green-600">Scan code at /customer/qr/{state.data.code}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="businessId">Business</Label>
          <select
            id="businessId"
            name="businessId"
            required
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="w-full border rounded-md p-2 bg-background"
          >
            <option value="">Select business</option>
            {loading && <option disabled>Loading...</option>}
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name} {b.industry ? `(${b.industry})` : ""}</option>
            ))}
          </select>
        </div>

        {modes.length > 0 && (
          <div className="space-y-2">
            <Label>Experience Mode</Label>
            <div className="grid gap-2">
              {modes.map((m) => (
                <label key={m.value} className="flex items-center gap-3 border rounded-md p-3 cursor-pointer hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input type="radio" name="mode" value={m.value} className="accent-primary" />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="label">Label (optional)</Label>
          <Input id="label" name="label" placeholder="e.g. Main Entrance Menu" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationUrl">Custom URL (optional)</Label>
          <Input id="destinationUrl" name="destinationUrl" type="url" placeholder="https://..." />
        </div>

        <Button type="submit" className="w-full" disabled={pending || !selectedBusiness}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate QR Experience
        </Button>
      </form>
    </div>
  );
}
