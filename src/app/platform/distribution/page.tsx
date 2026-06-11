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
  getCampaignsAction,
  getQRCodesAction,
  getDistributionMetricsAction,
  createCampaignAction,
  assignQRCodesAction,
  installQRCodeAction,
} from "@/server/actions/distribution";
import {
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Calendar,
  FileText,
  Users,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  totalQRCodes: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdById: string;
  createdAt: string;
};

type QRCode = {
  id: string;
  code: string;
  campaignId: string;
  status: string;
  assignedToId: string | null;
  businessId: string | null;
  location: string | null;
  installedAt: string | null;
  notes: string | null;
  createdAt: string;
  campaign: { id: string; name: string } | null;
  business: { id: string; businessName: string } | null;
};

type Metrics = {
  totalQRCodes: number;
  installed: number;
  active: number;
  inactive: number;
};

const TAB_KEYS = ["overview", "campaigns", "qrcodes"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  campaigns: "Campaigns",
  qrcodes: "QR Codes",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  ACTIVE: "success",
  INACTIVE: "outline",
  COMPLETED: "secondary",
  DRAFT: "warning",
  INSTALLED: "success",
  ASSIGNED: "warning",
  AVAILABLE: "outline",
  ARCHIVED: "destructive",
};

export default function PlatformDistributionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrStatusFilter, setQrStatusFilter] = useState("ALL");
  const [qrCampaignFilter, setQrCampaignFilter] = useState("ALL");
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    slug: "",
    description: "",
    totalQRCodes: "",
    startDate: "",
    endDate: "",
  });
  const [assignForm, setAssignForm] = useState({ assignedTo: "", notes: "" });
  const [installForm, setInstallForm] = useState({ businessId: "", location: "", notes: "" });

  const loadMetrics = useCallback(async () => {
    try {
      const data = await getDistributionMetricsAction();
      setMetrics(data as unknown as Metrics);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getCampaignsAction();
      setCampaigns(data as unknown as Campaign[]);
    } catch (e) {
      console.error("Failed to load campaigns:", e);
    }
  }, []);

  const loadQRCodes = useCallback(async () => {
    try {
      const filters: Record<string, string> = {};
      if (qrStatusFilter !== "ALL") filters.status = qrStatusFilter;
      if (qrCampaignFilter !== "ALL") filters.campaignId = qrCampaignFilter;
      const data = await getQRCodesAction(filters);
      setQrCodes(data as unknown as QRCode[]);
    } catch (e) {
      console.error("Failed to load QR codes:", e);
    }
  }, [qrStatusFilter, qrCampaignFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMetrics(), loadCampaigns(), loadQRCodes()]).finally(() =>
      setLoading(false),
    );
  }, [loadMetrics, loadCampaigns, loadQRCodes]);

  const handleCreateCampaign = async () => {
    const fd = new FormData();
    fd.set("name", campaignForm.name);
    fd.set("slug", campaignForm.slug);
    fd.set("description", campaignForm.description);
    fd.set("totalQRCodes", campaignForm.totalQRCodes);
    if (campaignForm.startDate) fd.set("startDate", campaignForm.startDate);
    if (campaignForm.endDate) fd.set("endDate", campaignForm.endDate);
    await createCampaignAction(null, fd);
    setCampaignDialogOpen(false);
    setCampaignForm({
      name: "",
      slug: "",
      description: "",
      totalQRCodes: "",
      startDate: "",
      endDate: "",
    });
    loadCampaigns();
    loadMetrics();
  };

  const handleAssign = async () => {
    if (!selectedQrId) return;
    const fd = new FormData();
    fd.set("qrCodeIds", JSON.stringify([selectedQrId]));
    fd.set("assignedTo", assignForm.assignedTo);
    fd.set("notes", assignForm.notes);
    await assignQRCodesAction(null, fd);
    setAssignDialogOpen(false);
    setAssignForm({ assignedTo: "", notes: "" });
    setSelectedQrId(null);
    loadQRCodes();
  };

  const handleInstall = async () => {
    if (!selectedQrId) return;
    const fd = new FormData();
    fd.set("qrCodeId", selectedQrId);
    fd.set("businessId", installForm.businessId);
    fd.set("location", installForm.location);
    fd.set("notes", installForm.notes);
    await installQRCodeAction(null, fd);
    setInstallDialogOpen(false);
    setInstallForm({ businessId: "", location: "", notes: "" });
    setSelectedQrId(null);
    loadQRCodes();
    loadMetrics();
  };

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
        <PageHeader title="Distribution" description="Manage distribution network" />
        {renderTabNav()}
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Distribution" description="Manage distribution network" />
      {renderTabNav()}

      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalQRCodes ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Installed</CardTitle>
              <Smartphone className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.installed ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active ?? "--"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.inactive ?? "--"}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "campaigns" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Distribution Campaigns</CardTitle>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="Q3 Distribution"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={campaignForm.slug}
                      onChange={(e) => setCampaignForm({ ...campaignForm, slug: e.target.value })}
                      placeholder="q3-distribution"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total QR Codes</label>
                    <Input
                      type="number"
                      value={campaignForm.totalQRCodes}
                      onChange={(e) => setCampaignForm({ ...campaignForm, totalQRCodes: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={campaignForm.startDate}
                        onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={campaignForm.endDate}
                        onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateCampaign} className="w-full">
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No campaigns yet</p>
                <p className="text-sm text-muted-foreground">Create your first distribution campaign</p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">QR Codes</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Start Date</div>
                  <div className="col-span-3">Created</div>
                </div>
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-3">
                      <p className="text-sm font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.slug}</p>
                    </div>
                    <div className="text-sm md:col-span-2">{campaign.totalQRCodes}</div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[campaign.status] || "outline"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                      {campaign.startDate ? (
                        <>
                          <Calendar className="h-3 w-3" />
                          {formatDate(campaign.startDate)}
                        </>
                      ) : (
                        "--"
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-3">
                      <Calendar className="h-3 w-3" />
                      {formatDate(campaign.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "qrcodes" && (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={qrStatusFilter}
                  onChange={(e) => setQrStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Status" },
                    { value: "AVAILABLE", label: "Available" },
                    { value: "ASSIGNED", label: "Assigned" },
                    { value: "INSTALLED", label: "Installed" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
                <Select
                  value={qrCampaignFilter}
                  onChange={(e) => setQrCampaignFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Campaigns" },
                    ...campaigns.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    Promise.all([loadMetrics(), loadCampaigns(), loadQRCodes()]).finally(() =>
                      setLoading(false),
                    );
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {qrCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <QrCode className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No QR codes found</p>
                <p className="text-sm text-muted-foreground">
                  {qrStatusFilter !== "ALL" || qrCampaignFilter !== "ALL"
                    ? "No QR codes match the current filters"
                    : "Generate QR codes from a campaign first"}
                </p>
              </div>
            ) : (
              <div>
                <div className="hidden grid-cols-12 gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
                  <div className="col-span-2">Code</div>
                  <div className="col-span-2">Campaign</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Business</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-2"></div>
                </div>
                {qrCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="grid grid-cols-1 gap-2 border-b px-6 py-4 last:border-0 md:grid-cols-12 md:items-center"
                  >
                    <div className="flex items-center gap-2 md:col-span-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono">{qr.code.slice(0, 12)}...</span>
                    </div>
                    <div className="text-sm md:col-span-2">
                      {qr.campaign?.name ?? "Unknown"}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={STATUS_VARIANTS[qr.status] || "outline"}>
                        {qr.status}
                      </Badge>
                    </div>
                    <div className="text-sm md:col-span-2">
                      {qr.business?.businessName ?? "--"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:col-span-2">
                      <Calendar className="h-3 w-3" />
                      {formatDate(qr.createdAt)}
                    </div>
                    <div className="flex justify-end gap-1 md:col-span-2">
                      {qr.status === "AVAILABLE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedQrId(qr.id);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Users className="mr-1 h-3 w-3" />
                          Assign
                        </Button>
                      )}
                      {(qr.status === "ASSIGNED" || qr.status === "AVAILABLE") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedQrId(qr.id);
                            setInstallDialogOpen(true);
                          }}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Install
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign To (User ID)</label>
              <Input
                value={assignForm.assignedTo}
                onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                placeholder="User ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <Button onClick={handleAssign} className="w-full">
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business ID</label>
              <Input
                value={installForm.businessId}
                onChange={(e) => setInstallForm({ ...installForm, businessId: e.target.value })}
                placeholder="Business ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={installForm.location}
                onChange={(e) => setInstallForm({ ...installForm, location: e.target.value })}
                placeholder="e.g. Front counter"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={installForm.notes}
                onChange={(e) => setInstallForm({ ...installForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <Button onClick={handleInstall} className="w-full">
              Install
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
