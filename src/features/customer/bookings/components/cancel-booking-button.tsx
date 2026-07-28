"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelBookingAction } from "../actions";
import { Loader2 } from "lucide-react";

// export function CancelBookingButton({ bookingId, businessSlug }: { bookingId: string; businessSlug: string }) {
//   const router = useRouter();
//   const [state, action, pending] = useActionState(
//     async () => cancelBookingAction(bookingId),
//     null,
//   );
// 
//   useEffect(() => {
//     if (state?.success) router.refresh();
//   }, [state, router]);
// 
//   return (
//     <form action={action}>
//       <Button type="submit" variant="destructive" size="sm" disabled={pending}>
//         {pending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
//         Cancel Booking
//       </Button>
//       {state?.message && !state?.success && (
//         <p className="text-xs text-destructive mt-1">{state.message}</p>
//       )}
//     </form>
//   );
// }
