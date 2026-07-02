"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2 } from "lucide-react";
import { createStorefrontAction } from "@/features/storefront/actions";

export default function NewStorefrontPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createStorefrontAction, null);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/businesses?select=id,name")
      .then((r) => r.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/platform/sales-team/storefront/${state.data.id}`);
    }
  }, [state, router]);

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <PageHeader title="New Storefront" description="Create an online storefront for a business" />

      <form action={action} className="space-y-6 border rounded-lg p-6 bg-card">
        {state?.message && !state?.success && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="businessId">Business</Label>
          <select id="businessId" name="businessId" required className="w-full border rounded-md p-2 bg-background">
            <option value="">Select business</option>
            {loading && <option disabled>Loading...</option>}
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Storefront Name</Label>
          <Input id="name" name="name" required placeholder="e.g. Enkai Demo Shop" />
          <p className="text-xs text-muted-foreground">This will be used to generate the subdomain</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline (optional)</Label>
          <Input id="tagline" name="tagline" placeholder="e.g. Your one-stop shop" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <textarea id="description" name="description" className="w-full border rounded-md p-2 bg-background min-h-[80px]" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#3B82F6" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <Input id="secondaryColor" name="secondaryColor" type="color" defaultValue="#1E40AF" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <Input id="accentColor" name="accentColor" type="color" defaultValue="#F59E0B" />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Storefront
        </Button>
      </form>
    </div>
  );
}
