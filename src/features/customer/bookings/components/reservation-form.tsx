"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarCheck } from "lucide-react";
import { createReservationAction } from "../actions";

interface ReservationFormProps {
  businessId: string;
  businessSlug: string;
}

export function ReservationForm({ businessId, businessSlug }: ReservationFormProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [state, action, pending] = useActionState(createReservationAction, null);

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/customer/bookings?business=${businessSlug}`);
    }
  }, [state, router, businessSlug]);

  return (
    <form action={action} className="space-y-6 border rounded-lg p-6">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="startTime" value={date && time ? `${date}T${time}:00+03:00` : ""} />

      {state?.message && !state?.success && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guests">Number of Guests</Label>
        <Input
          id="guests" name="guests" type="number" min={1} max={50}
          value={guests} onChange={(e) => setGuests(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Notes (optional)</Label>
        <textarea
          id="notes" name="notes"
          className="w-full border rounded-md p-2 bg-background min-h-[80px]"
          placeholder="Any special requests or dietary requirements..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending || !date || !time}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
        Confirm Reservation
      </Button>
    </form>
  );
}
