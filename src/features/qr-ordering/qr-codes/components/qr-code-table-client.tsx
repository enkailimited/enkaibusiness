"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { QR_CODE_STATUS_LABELS, QR_CODE_STATUS_VARIANTS } from "../../constants";
import { formatDate } from "@/lib/utils";
import type { QRCodeWithRelations } from "../types";

interface QRCodeTableClientProps {
  qrCodes: QRCodeWithRelations[];
}

export function QRCodeTableClient({ qrCodes }: QRCodeTableClientProps) {
  const columns = [
    {
      key: "code",
      header: "Code",
      cell: (qr: QRCodeWithRelations) => (
        <span className="font-mono text-sm font-medium">{qr.code}</span>
      ),
    },
    {
      key: "campaign",
      header: "Campaign",
      cell: (qr: QRCodeWithRelations) => (
        <span className="text-muted-foreground">{qr.campaign.name}</span>
      ),
    },
    {
      key: "business",
      header: "Business",
      cell: (qr: QRCodeWithRelations) => (
        <span className="text-muted-foreground">{qr.business?.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (qr: QRCodeWithRelations) => (
        <Badge variant={(QR_CODE_STATUS_VARIANTS[qr.status] ?? "secondary") as any}>
          {QR_CODE_STATUS_LABELS[qr.status] ?? qr.status}
        </Badge>
      ),
    },
    {
      key: "installedAt",
      header: "Installed At",
      cell: (qr: QRCodeWithRelations) => (
        <span className="text-sm text-muted-foreground">
          {qr.installedAt ? formatDate(qr.installedAt) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (qr: QRCodeWithRelations) => (
        <span className="text-sm text-muted-foreground">{formatDate(qr.createdAt)}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={qrCodes}
      emptyTitle="No QR codes found"
      emptyDescription="Generate QR codes for a campaign to get started."
    />
  );
}
