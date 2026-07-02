"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Archive } from "lucide-react";
import { publishStorefrontAction, archiveStorefrontAction } from "../actions";

export function StorefrontActions({ storefrontId, status }: { storefrontId: string; status: string }) {
  const router = useRouter();

  const [pubState, publish, pubPending] = useActionState(async () => {
    const res = await publishStorefrontAction(storefrontId);
    if (res.success) router.refresh();
    return res;
  }, null);

  const [archState, archive, archPending] = useActionState(async () => {
    const res = await archiveStorefrontAction(storefrontId);
    if (res.success) router.refresh();
    return res;
  }, null);

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <form action={publish}>
          <Button type="submit" size="sm" disabled={pubPending}>
            {pubPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
            Publish
          </Button>
        </form>
      )}
      {status !== "ARCHIVED" && (
        <form action={archive}>
          <Button type="submit" size="sm" variant="outline" disabled={archPending}>
            {archPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Archive className="h-3 w-3 mr-1" />}
            Archive
          </Button>
        </form>
      )}
    </div>
  );
}
