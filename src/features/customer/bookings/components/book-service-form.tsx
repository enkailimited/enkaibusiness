"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar } from "lucide-react";
import { createBookingAction } from "../actions";

interface ServiceOption {
  id: string; name: string; slug: string; price: number; description: string | null;
}

interface BookServiceFormProps {
  services: ServiceOption[];
  preselectedServiceId: string | null;
  businessId: string;
  businessSlug: string;
}

export function BookServiceForm({ services, preselectedServiceId, businessId, businessSlug }: BookServiceFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(preselectedServiceId || services[0]?.id || "");
  const selectedService = services.find((s) => s.id === serviceId);
  const [state, action, pending] = useActionState(createBookingAction, null);

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/customer/bookings/${state.data.id}?business=${businessSlug}`);
    }
  }, [state, router, businessSlug]);

  return (
    <form action={action} className="space-y-6 border rounded-lg p-6">
      <input type="hidden" name="businessId" value={businessId} />

      {state?.message && !state?.success && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="service">Service</Label>
        <select
          id="service"
          name="catalogItemId"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full border rounded-md p-2 bg-background"
          required
        >
          <option value="" disabled>Select a service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.price.toLocaleString()} TZS
            </option>
          ))}
        </select>
        {selectedService?.description && (
          <p className="text-xs text-muted-foreground">{selectedService.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" name="title" placeholder="e.g. Consultation" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Date & Time</Label>
          <Input id="startTime" name="startTime" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" min={15} step={15} defaultValue={60} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partySize">Number of People</Label>
          <Input id="partySize" name="partySize" type="number" min={1} defaultValue={1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
        </div>
      </div>

      <input type="hidden" name="unitPrice" value={selectedService?.price || 0} />

      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests (optional)</Label>
        <textarea
          id="specialRequests"
          name="specialRequests"
          className="w-full border rounded-md p-2 bg-background min-h-[80px]"
          placeholder="Any special requirements..."
        />
      </div>

      <div className="border-t pt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="text-xl font-bold">{selectedService?.price.toLocaleString() || "0"} TZS</p>
        </div>
        <Button type="submit" disabled={pending || !serviceId}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
