"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Power, PowerOff } from "lucide-react";
import { activateQRExperienceAction, deactivateQRExperienceAction } from "../actions";

export function QrActions({ experienceId, status, code }: { experienceId: string; status: string; code: string }) {
  const router = useRouter();
  const [actState, activate, actPending] = useActionState(async () => {
    const res = await activateQRExperienceAction(experienceId);
    router.refresh();
    return res;
  }, null);

  const [deactState, deactivate, deactPending] = useActionState(async () => {
    const res = await deactivateQRExperienceAction(experienceId);
    router.refresh();
    return res;
  }, null);

  return (
    <div className="flex gap-2">
      {status === "ACTIVE" ? (
        <form action={deactivate}>
          <Button type="submit" size="sm" variant="outline" disabled={deactPending}>
            {deactPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <PowerOff className="h-3 w-3 mr-1" />}
            Deactivate
          </Button>
        </form>
      ) : (
        <form action={activate}>
          <Button type="submit" size="sm" variant="default" disabled={actPending}>
            {actPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Power className="h-3 w-3 mr-1" />}
            Activate
          </Button>
        </form>
      )}
    </div>
  );
}
