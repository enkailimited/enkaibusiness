import { requireAuth } from "@/server/auth";
import { getAccounts } from "../services/credit-service";
import { AccountTableClient } from "./account-table-client";

interface AccountListProps {
  businessId: string;
}

export async function AccountList({ businessId }: AccountListProps) {
  await requireAuth();
  const accounts = await getAccounts(businessId);

  return <AccountTableClient accounts={accounts} />;
}
