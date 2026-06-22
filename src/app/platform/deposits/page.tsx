"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  listPendingDepositsAction,
  approveDepositRequestAction,
  rejectDepositRequestAction,
} from "@/features/subscriptions/wallet-deposits/actions";
import type { DepositRequestListItem } from "@/features/subscriptions/wallet-deposits/types";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-TZ", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function PlatformDepositsPage() {
  const [requests, setRequests] = useState<DepositRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string; business: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPendingDepositsAction();
      setRequests(data ?? []);
    } catch (e) {
      console.error("Failed to load deposits:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const result = await approveDepositRequestAction(id);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error("Approve error:", e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setProcessing(rejectDialog.id);
    try {
      const result = await rejectDepositRequestAction(rejectDialog.id, rejectNotes || undefined);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== rejectDialog.id));
        setRejectDialog(null);
        setRejectNotes("");
      } else {
        alert(result.message);
      }
    } catch (e) {
      console.error("Reject error:", e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit Approvals" description="Review and approve wallet deposit requests">
        <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="mb-3 h-12 w-12 text-green-400" />
            <p className="font-medium">No pending deposit requests</p>
            <p className="mt-1 text-sm text-muted-foreground">
              All deposit requests have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                      <span className="text-lg font-bold">{formatCurrency(req.amount)}</span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">{req.businessName}</span>
                      </p>
                      <p>Requested by: {req.requestedBy.firstName ?? ""} {req.requestedBy.lastName ?? ""} ({req.requestedBy.email})</p>
                      {req.reference && <p>Ref: {req.reference}</p>}
                      {req.description && <p>{req.description}</p>}
                      <p className="text-xs">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id}
                    >
                      {processing === req.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectDialog({ id: req.id, business: req.businessName })}
                      disabled={processing === req.id}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deposit Request</DialogTitle>
            <DialogDescription>
              Reject deposit for <strong>{rejectDialog?.business}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing === rejectDialog?.id}
            >
              {processing === rejectDialog?.id ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
