import { requireAuth } from "@/server/auth";
import { getAccounts } from "../services/credit-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_STATUS_LABELS } from "../constants";
import { formatCurrency } from "@/lib/utils";
import type { CreditAccountWithCustomer } from "../types";

interface AccountListProps {
  businessId: string;
}

export async function AccountList({ businessId }: AccountListProps) {
  await requireAuth();
  const accounts = await getAccounts(businessId);

  const columns = [
    {
      key: "customer",
      header: "Customer",
      cell: (account: CreditAccountWithCustomer) => (
        <span className="font-medium">
          {account.customer.firstName}
          {account.customer.lastName ? ` ${account.customer.lastName}` : ""}
        </span>
      ),
    },
    {
      key: "creditLimit",
      header: "Credit Limit",
      cell: (account: CreditAccountWithCustomer) => (
        <span className="font-mono text-sm">{formatCurrency(account.creditLimit)}</span>
      ),
    },
    {
      key: "currentBalance",
      header: "Balance",
      cell: (account: CreditAccountWithCustomer) => (
        <span className="font-mono text-sm">{formatCurrency(account.currentBalance)}</span>
      ),
    },
    {
      key: "utilization",
      header: "Utilization",
      cell: (account: CreditAccountWithCustomer) => {
        const pct = account.creditLimit > 0
          ? Math.round((account.currentBalance / account.creditLimit) * 100)
          : 0;
        const variant = pct > 90 ? "destructive" : pct > 70 ? "warning" : "success";
        return (
          <Badge variant={variant}>
            {pct}%
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (account: CreditAccountWithCustomer) => {
        const variant = account.status === "active" ? "success" : account.status === "frozen" ? "warning" : "destructive";
        return (
          <Badge variant={variant}>
            {ACCOUNT_STATUS_LABELS[account.status] ?? account.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={accounts}
      emptyTitle="No credit accounts found"
      emptyDescription="Create a credit account for a customer to get started."
    />
  );
}
