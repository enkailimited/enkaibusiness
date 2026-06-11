"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getCommissionRulesAction,
  getCommissionLedgerAction,
  getPayoutsAction,
  getCommissionMetricsAction,
  createCommissionRuleAction,
  approveCommissionAction,
  createPayoutAction,
} from "@/server/actions/commissions";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Wallet,
  Plus,
  RefreshCw,
  CheckCircle,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type CommissionRule = {
  id: string;
  name: string;
  hierarchyLevelId: string | null;
  type: string;
  value: number;
  minAmount: number | null;
  maxAmount: number | null;
  status: string;
  createdAt: string;
};

type LedgerEntry = {
  id: string;
  salesProfileId: string;
  sourceType: string;
  sourceId: string;
  amount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  salesProfile: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  } | null;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  processedById: string;
  createdAt: string;
  entries: LedgerEntry[];
};

type Metrics = {
  totalEarned: number;
  paidOut: number;
  pending: number;
};

const TAB_KEYS = ["dashboard", "rules", "ledger", "payouts"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  dashboard: "Dashboard",
  rules: "Rules",
  ledger: "Ledger",
  payouts: "Payouts",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "outline",
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
  CANCELLED: "destructive",
};

export default function PlatformCommissionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("ALL");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    minAmount: "",
    maxAmount: "",
  });

  const loadMetrics = useCallback(async () => {
    try {
      const data = await getCommissionMetricsAction();
      setMetrics(data as unknown as Metrics);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const data = await getCommissionRulesAction();
      setRules(data as unknown as CommissionRule[]);
    } catch (e) {
      console.error("Failed to load rules:", e);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      const data = await getCommissionLedgerAction("all");
      setLedger(data as unknown as LedgerEntry[]);
    } catch (e) {
      console.error("Failed to load ledger:", e);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    try {
      const data = await getPayoutsAction();
      setPayouts(data as unknown as Payout[]);
    } catch (e) {
      console.error("Failed to load payouts:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMetrics(), loadRules(), loadLedger(), loadPayouts()]).finally(
      () => setLoading(false),
    );
  }, [loadMetrics, loadRules, loadLedger, loadPayouts]);

  const handleCreateRule = async () => {
    const fd = new FormData();
    fd.set("name", ruleForm.name);
    fd.set("type", ruleForm.type);
    fd.set("value", ruleForm.value);
    if (ruleForm.minAmount) fd.set("minAmount", ruleForm.minAmount);
    if (ruleForm.maxAmount) fd.set("maxAmount", ruleForm.maxAmount);
    await createCommissionRuleAction(null, fd);
    setRuleDialogOpen(false);
    setRuleForm({ name: "", type: "PERCENTAGE", value: "", minAmount: "", maxAmount: "" });
    loadRules();
  };

  const handleApprove = async (id: string) => {
    await approveCommissionAction(id);
    loadLedger();
  };

  const handlePayout = async () => {
    const fd = new FormData();
    fd.set("entries", JSON.stringify(ledger.filter((e) => e.status === "APPROVED").map((e) => e.id)));
    fd.set("amount", String(ledger.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0)));
    await createPayoutAction(null, fd);
    loadPayouts();
    loadLedger();
    loadMetrics();
  };

  const filteredLedger = ledger.filter(
    (e) => ledgerStatusFilter === "ALL" || e.status === ledgerStatusFilter,
  );

  const renderTabNav = () => (
    <div className="flex gap-1 overflow-x-auto rounded-lg border p-1">
      {TAB_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent"
          }`}
        >
          {TAB_LABELS[key]}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Commissions" description="Manage sales commissions" />
        {renderTabNav()}
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Commissions" description="Manage sales commissions" />
      {renderTabNav()}

      {activeTab === "dashboard" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? new Intl.NumberFormat().format(metrics.totalEarned) : "--"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? new Intl.NumberFormat().format(metrics.paidOut) : "--"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? new Intl.NumberFormat().format(metrics.pending) : "--"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "rules" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Commission Rules</CardTitle>
            <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Commission Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={ruleForm.name}
                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                      placeholder="Referral Commission"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={ruleForm.type}
                      onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                      options={[
                        { value: "PERCENTAGE", label: "Percentage" },
                        { value: "FIXED", label: "Fixed Amount" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Value</label>
                    <Input
                      type="number"
                      value={ruleForm.value}
                      onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Min Amount</label>
                      <Input
                        type="number"
                        value={ruleForm.minAmount}
                        onChange={(e) => setRuleForm({ ...ruleForm, minAmount: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Amount</label>
                      <Input
                        type="number"
                        value={ruleForm.maxAmount}
                        onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateRule} className="w-full">
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No rules yet</p>
                <p className="text-sm text-muted-foreground">Create your first commission rule</p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Value</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Created</div>
                </div>
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="text-sm font-medium md:col-span-3">{rule.name}</div>
                    <div className="text-sm md:col-span-2">
                      {rule.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                    </div>
                    <div className="text-sm md:col-span-2">
                      {rule.type === "PERCENTAGE" ? `${rule.value}%` : new Intl.NumberFormat().format(rule.value)}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[rule.status] || "outline"}>
                        {rule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-3">
                      <Calendar className="h-3 w-3" />
                      {formatDate(rule.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "ledger" && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "PENDING", label: "Pending" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "PAID", label: "Paid" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    Promise.all([loadMetrics(), loadRules(), loadLedger(), loadPayouts()]).finally(
                      () => setLoading(false),
                    );
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              {ledger.filter((e) => e.status === "APPROVED").length > 0 && (
                <Button size="sm" onClick={handlePayout}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Approved
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLedger.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <DollarSign className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No ledger entries</p>
                <p className="text-sm text-muted-foreground">
                  {ledgerStatusFilter !== "ALL"
                    ? "No entries match the current filter"
                    : "No commission entries recorded yet"}
                </p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Sales Person</div>
                  <div className="col-span-2">Source</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1"></div>
                </div>
                {filteredLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="text-sm font-medium md:col-span-3">
                      {entry.salesProfile
                        ? `${entry.salesProfile.user.firstName} ${entry.salesProfile.user.lastName}`
                        : "Unknown"}
                    </div>
                    <div className="text-sm md:col-span-2">{entry.sourceType}</div>
                    <div className="text-sm font-medium md:col-span-2">
                      {new Intl.NumberFormat().format(entry.amount)}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[entry.status] || "outline"}>
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.createdAt)}
                    </div>
                    <div className="flex justify-end md:col-span-1">
                      {entry.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleApprove(entry.id)}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "payouts" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Payout History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                Promise.all([loadMetrics(), loadRules(), loadLedger(), loadPayouts()]).finally(
                  () => setLoading(false),
                );
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {payouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Wallet className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No payouts yet</p>
                <p className="text-sm text-muted-foreground">Payouts will appear here once processed</p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Amount</div>
                  <div className="col-span-2">Entries</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2">Notes</div>
                </div>
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="text-sm font-medium md:col-span-3">
                      {new Intl.NumberFormat().format(payout.amount)}
                    </div>
                    <div className="text-sm md:col-span-2">{payout.entries.length}</div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[payout.status] || "outline"}>
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-3">
                      <Calendar className="h-3 w-3" />
                      {formatDate(payout.createdAt)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground md:col-span-2">
                      {payout.notes || "--"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
