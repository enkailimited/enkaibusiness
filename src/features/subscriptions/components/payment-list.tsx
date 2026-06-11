import { requireAuth } from "@/server/auth";
import { getAllPayments } from "../services/payment-service";
import { DataTable } from "@/components/shared/data-table";
import type { SubscriptionPayment } from "@prisma/client";

interface PaymentWithRelations extends SubscriptionPayment {
  subscription: {
    id: string;
    plan: { name: string };
    business: { id: string; name: string };
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function PaymentList() {
  await requireAuth();
  const payments = await getAllPayments();

  const columns = [
    {
      key: "business",
      header: "Business",
      cell: (p: PaymentWithRelations) => (
        <span className="font-medium">{p.subscription.business.name}</span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (p: PaymentWithRelations) => (
        <span>{p.subscription.plan.name}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (p: PaymentWithRelations) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(Number(p.amount))}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (p: PaymentWithRelations) => (
        <span className="text-muted-foreground">{p.method ?? "—"}</span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      cell: (p: PaymentWithRelations) => (
        <span className="text-muted-foreground">{p.reference ?? "—"}</span>
      ),
    },
    {
      key: "paidAt",
      header: "Date",
      cell: (p: PaymentWithRelations) => (
        <span className="text-muted-foreground">
          {formatDate(p.paidAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments as unknown as PaymentWithRelations[]}
      emptyTitle="No payments recorded"
      emptyDescription="Payments will appear here once recorded."
    />
  );
}
