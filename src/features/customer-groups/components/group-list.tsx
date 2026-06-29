import { requireAuth } from "@/server/auth";
import { listGroups } from "../services/group-service";
import { GroupTableClient } from "./group-table-client";

interface GroupListProps {
  businessId: string;
}

export async function GroupList({ businessId }: GroupListProps) {
  await requireAuth();
  const groups = await listGroups(businessId);

  return <GroupTableClient groups={groups} />;
}
