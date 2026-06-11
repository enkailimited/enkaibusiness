import { requireAuth } from "@/server/auth";
import { listRegisters } from "../services/register-service";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { REGISTER_TYPE_LABELS, REGISTER_TYPE_VARIANTS } from "../constants";
import { formatCurrency } from "@/lib/utils";
import type { RegisterWithTransactions } from "../types";

interface RegisterListProps {
  businessId: string;
}

export async function RegisterList({ businessId }: RegisterListProps) {
  await requireAuth();
  const registers = await listRegisters(businessId);

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (reg: RegisterWithTransactions) => (
        <span className="font-medium">{reg.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (reg: RegisterWithTransactions) => (
        <Badge variant={REGISTER_TYPE_VARIANTS[reg.type] ?? "secondary"}>
          {REGISTER_TYPE_LABELS[reg.type] ?? reg.type}
        </Badge>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      cell: (reg: RegisterWithTransactions) => (
        <span className="text-muted-foreground">{reg.branch?.name ?? "—"}</span>
      ),
    },
    {
      key: "store",
      header: "Store",
      cell: (reg: RegisterWithTransactions) => (
        <span className="text-muted-foreground">{reg.store?.name ?? "—"}</span>
      ),
    },
    {
      key: "currentBalance",
      header: "Balance",
      cell: (reg: RegisterWithTransactions) => (
        <span className="font-mono text-sm font-medium">{formatCurrency(reg.currentBalance)}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (reg: RegisterWithTransactions) => (
        <Badge variant={reg.isActive ? "default" : "secondary"}>
          {reg.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={registers}
      emptyTitle="No registers found"
      emptyDescription="Create your first cash register to get started."
    />
  );
}
