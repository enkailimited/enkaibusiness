import { requireAuth } from "@/server/auth";
import { listCampaigns } from "../services/campaign-service";
import { CampaignTableClient } from "./campaign-table-client";

interface CampaignListProps {
  status?: string;
}

export async function CampaignList({ status }: CampaignListProps) {
  await requireAuth();
  const campaigns = await listCampaigns(status ? { status: status as any } : undefined);

  return <CampaignTableClient campaigns={campaigns} />;
}
