"use client";

import { useState, useEffect, useCallback } from "react";
import { getBusinessesForAdminAction, approveTopUpAction, rejectTopUpAction } from "../actions";

interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  status: string;
  isActive: boolean;
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
  planName: string | null;
  planAmount: number | null;
  planInterval: string | null;
  subscriptionStatus: string | null;
  subscriptionId: string | null;
  walletBalance: number;
  totalDeposited: number;
  hasPendingDeposit: boolean;
  pendingDepositAmount: number | null;
  pendingDepositId: string | null;
  pendingDepositReference: string | null;
  pendingDepositProof: string | null;
}

export function AdminActivationList() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionMsg, setActionMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getBusinessesForAdminAction();
    setBusinesses(data as unknown as BusinessItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (requestId: string) => {
    setActionMsg(null);
    const result = await approveTopUpAction(requestId);
    setActionMsg({ id: requestId, type: result.success ? "success" : "error", text: result.message });
    if (result.success) await load();
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("Reason for rejection (optional):");
    if (reason === null) return;
    setActionMsg(null);
    const result = await rejectTopUpAction(requestId, reason || undefined);
    setActionMsg({ id: requestId, type: result.success ? "success" : "error", text: result.message });
    if (result.success) await load();
  };

  const filtered = businesses.filter((b) => {
    if (filter === "pending") return b.status === "PENDING_SETUP";
    if (filter === "active") return b.status === "ACTIVE";
    if (filter === "hasDeposit") return b.hasPendingDeposit;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["all", "pending", "hasDeposit", "active"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f === "all" ? "All" : f === "pending" ? "Pending Setup" : f === "hasDeposit" ? "With Deposits" : "Active"}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          No businesses found
        </div>
      )}

      {filtered.map((b) => (
        <div key={b.id} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{b.name}</h3>
              <p className="text-sm text-gray-500">{b.ownerName ?? "N/A"} &middot; {b.ownerEmail ?? "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                b.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                b.status === "PENDING_SETUP" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {b.status}
              </span>
              {b.subscriptionStatus && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  b.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-800" :
                  b.subscriptionStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {b.subscriptionStatus}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Plan:</span>
              <span className="ml-1 font-medium">{b.planName ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-1 font-medium">{b.planAmount?.toLocaleString() ?? "N/A"} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Wallet:</span>
              <span className="ml-1 font-medium">{b.walletBalance.toLocaleString()} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Deposited:</span>
              <span className="ml-1 font-medium">{b.totalDeposited.toLocaleString()} TZS</span>
            </div>
          </div>

          {actionMsg && actionMsg.id === b.pendingDepositId && (
            <div className={`text-sm p-3 rounded-lg ${actionMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {actionMsg.text}
            </div>
          )}

          {b.hasPendingDeposit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">
                  Pending Deposit: {b.pendingDepositAmount?.toLocaleString()} TZS
                </span>
                <span className="text-xs text-gray-500">Ref: {b.pendingDepositReference ?? "N/A"}</span>
              </div>
              {b.pendingDepositProof && (
                <div className="text-sm text-gray-600">
                  Payment Proof: <a href={b.pendingDepositProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => b.pendingDepositId && handleApprove(b.pendingDepositId)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Approve & Activate
                </button>
                <button
                  onClick={() => b.pendingDepositId && handleReject(b.pendingDepositId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
