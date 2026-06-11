import { requireAuth } from "@/server/auth";
import { listCampaigns } from "../services/campaign-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_VARIANTS } from "../../constants";
import { formatDate } from "@/lib/utils";
import type { CampaignWithCount } from "../types";

interface CampaignListProps {
  status?: string;
}

export async function CampaignList({ status }: CampaignListProps) {
  await requireAuth();
  const campaigns = await listCampaigns(status ? { status: status as any } : undefined);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (c: CampaignWithCount) => (
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c: CampaignWithCount) => (
        <Badge variant={(CAMPAIGN_STATUS_VARIANTS[c.status] ?? "secondary") as any}>
          {CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}
        </Badge>
      ),
    },
    {
      key: "qrCodes",
      header: "QR Codes",
      cell: (c: CampaignWithCount) => (
        <span className="font-mono text-sm">{c._count.qrCodes}</span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      cell: (c: CampaignWithCount) => (
        <span className="text-sm text-muted-foreground">
          {c.startDate ? formatDate(c.startDate) : "—"}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "End Date",
      cell: (c: CampaignWithCount) => (
        <span className="text-sm text-muted-foreground">
          {c.endDate ? formatDate(c.endDate) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (c: CampaignWithCount) => (
        <span className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={campaigns}
      emptyTitle="No campaigns found"
      emptyDescription="Create your first distribution campaign to get started."
    />
  );
}
