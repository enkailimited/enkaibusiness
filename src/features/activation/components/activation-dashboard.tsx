"use client";

import { useState, useEffect, useCallback } from "react";
import { getActivationInfoAction, submitTopUpAction } from "../actions";
import type { ActivationInfo } from "../services/activation-service";

interface Props { businessId: string }

export function ActivationDashboard({ businessId }: Props) {
  const [info, setInfo] = useState<ActivationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInfo = useCallback(async () => {
    setLoading(true);
    const data = await getActivationInfoAction(businessId);
    setInfo(data as unknown as ActivationInfo);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      setSubmitting(false);
      return;
    }
    if (!reference.trim()) {
      setMessage({ type: "error", text: "Please enter a payment reference" });
      setSubmitting(false);
      return;
    }

    const result = await submitTopUpAction(businessId, amt, reference.trim(), description.trim() || undefined);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) {
      setAmount("");
      setReference("");
      setDescription("");
      await loadInfo();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!info) {
    return <div className="p-8 text-center text-gray-500">Business not found</div>;
  }

  const remaining = Math.max(0, info.setupFee - info.walletBalance);
  const isFullyPaid = info.walletBalance >= info.setupFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">{info.businessName}</h1>
          <p className="text-sm text-gray-500 mt-1">Business Activation</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Plan Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Plan:</span>
              <span className="ml-2 font-medium">{info.planName ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Setup Fee:</span>
              <span className="ml-2 font-medium">{info.setupFee.toLocaleString()} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                {info.status === "PENDING_SETUP" ? "Pending Setup" : info.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Subscription:</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                {info.subscriptionStatus ?? "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Payment Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Wallet Balance:</span>
              <span className="ml-2 font-medium">{info.walletBalance.toLocaleString()} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Total Deposited:</span>
              <span className="ml-2 font-medium">{info.totalDeposited.toLocaleString()} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Required (Setup Fee):</span>
              <span className="ml-2 font-medium">{info.setupFee.toLocaleString()} TZS</span>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <span className={`ml-2 font-medium ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                {remaining > 0 ? `${remaining.toLocaleString()} TZS` : "Fully Paid"}
              </span>
            </div>
          </div>

          {isFullyPaid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Payment received. Awaiting administrator approval to activate your subscription.
            </div>
          )}
        </div>

        {!isFullyPaid && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Make a Payment</h2>
            <p className="text-sm text-gray-500">
              Top up your wallet to pay the setup fee. Your payment will be reviewed by an administrator.
            </p>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message.text}
              </div>
            )}

            {info.hasPendingRequest && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                You have a pending top-up request ({info.pendingRequestAmount?.toLocaleString()} TZS). Please wait for administrator review.
              </div>
            )}

            {!info.hasPendingRequest && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (TZS)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter payment reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Payment"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <button
            onClick={() => loadInfo()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &#8635; Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
