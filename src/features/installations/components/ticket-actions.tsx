"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { updateStatusAction, approveInstallationAction } from "../actions";
import { getValidNextStatuses } from "../services/installation-service";

export function TicketActions({
  ticketId, currentStatus, ownerApproved,
}: {
  ticketId: string; currentStatus: string; ownerApproved: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const validNext = getValidNextStatuses(status);
  const [pending, setPending] = useState(false);

  const advanceStatus = async (next: string) => {
    setPending(true);
    setStatus(next);
    await updateStatusAction(ticketId, next);
    setPending(false);
    router.refresh();
  };

  const handleApprove = async (approved: boolean) => {
    setPending(true);
    await approveInstallationAction(ticketId, approved);
    setPending(false);
    router.refresh();
  };

  const statusLabels: Record<string, string> = {
    ACTIVATED: "Activate",
    DISTRIBUTOR_ASSIGNED: "Assign Distributor",
    SITE_VISIT_SCHEDULED: "Schedule Visit",
    SITE_VISIT_COMPLETED: "Complete Visit",
    CONFIGURATION_IN_PROGRESS: "Start Configuration",
    CATALOG_PUBLISHED: "Publish Catalog",
    PAYMENT_CONFIGURED: "Configure Payment",
    DELIVERY_CONFIGURED: "Configure Delivery",
    QR_GENERATED: "Generate QR",
    QR_PRINTED: "Print QR",
    QR_INSTALLED: "Install QR",
    STAFF_TRAINED: "Complete Training",
    TESTING_IN_PROGRESS: "Start Testing",
    CUSTOMER_TEST_COMPLETED: "Complete Test",
    AWAITING_APPROVAL: "Submit for Approval",
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {validNext.filter((s) => s !== "DECLINED").map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === "ACTIVATED" ? "default" : "outline"}
          onClick={() => advanceStatus(next)}
          disabled={pending}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
          {statusLabels[next] || next.replace(/_/g, " ")}
        </Button>
      ))}

      {status === "AWAITING_APPROVAL" && !ownerApproved && (
        <div className="flex gap-2">
          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(true)} disabled={pending}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleApprove(false)} disabled={pending}>
            <XCircle className="h-3 w-3 mr-1" /> Decline
          </Button>
        </div>
      )}
    </div>
  );
}
