"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { Loader2 } from "lucide-react";
import { createTicketAction } from "@/features/installations/actions";

export default function NewInstallationPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createTicketAction, null);

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/platform/sales-team/installations/${state.data.id}`);
    }
  }, [state, router]);

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      <PageHeader title="New Installation Ticket" description="Start a new installation process for a business" />

      <form action={action} className="space-y-6 border rounded-lg p-6 bg-card">
        {state?.message && !state?.success && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="businessId">Business</Label>
          <BusinessSelect />
          <input type="hidden" name="branchId" id="branchId" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="requestedById">Requested By (User ID)</Label>
          <Input id="requestedById" name="requestedById" required placeholder="User UUID" />
          <p className="text-xs text-muted-foreground">The staff/user requesting this installation</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className="w-full border rounded-md p-2 bg-background" defaultValue="NEW_BUSINESS">
            <option value="NEW_BUSINESS">New Business</option>
            <option value="NEW_BRANCH">New Branch</option>
            <option value="UPGRADE">Upgrade</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="REPLACEMENT">Replacement</option>
            <option value="REINSTALLATION">Reinstallation</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea id="notes" name="notes" className="w-full border rounded-md p-2 bg-background min-h-[100px]" placeholder="Additional notes or instructions..." />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Ticket
        </Button>
      </form>
    </div>
  );
}

function BusinessSelect() {
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/businesses?select=id,name")
      .then((r) => r.json())
      .then(setBusinesses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <select id="businessId" name="businessId" required className="w-full border rounded-md p-2 bg-background">
      <option value="">Select business</option>
      {loading && <option disabled>Loading...</option>}
      {businesses.map((b: { id: string; name: string }) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
