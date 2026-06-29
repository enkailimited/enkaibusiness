import { requireAuth } from "@/server/auth";
import { listQRCodes } from "../services/qr-code-service";
import { QRCodeTableClient } from "./qr-code-table-client";

interface QRCodeListProps {
  campaignId?: string;
  businessId?: string;
  status?: string;
}

export async function QRCodeList({ campaignId, businessId, status }: QRCodeListProps) {
  await requireAuth();
  const qrCodes = await listQRCodes({ campaignId, businessId, status: status as any });

  return <QRCodeTableClient qrCodes={qrCodes} />;
}
