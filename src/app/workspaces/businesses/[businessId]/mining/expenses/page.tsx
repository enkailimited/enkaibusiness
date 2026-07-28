import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function MiningExpensesPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: { businessId, expenseDate: { gte: monthStart } },
    orderBy: { expenseDate: "desc" },
    take: 50,
    include: { category: { select: { id: true, name: true } } },
  });

  const aggregate = await prisma.expense.aggregate({
    where: { businessId, expenseDate: { gte: monthStart } },
    _sum: { amount: true },
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mining Expenses</h1>
        <p className="text-muted-foreground">Track operational expenses this month</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Monthly Expenses</p><p className="text-2xl font-bold">{aggregate._count}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Amount</p><p className="text-2xl font-bold">{Number(aggregate._sum.amount || 0).toLocaleString()} TZS</p></div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">This Month ({expenses.length})</h3></div>
        {expenses.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No expenses this month.</p>
        ) : (
          expenses.map((exp: any) => (
            <div key={exp.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{exp.category?.name || "Uncategorized"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(exp.expenseDate).toLocaleDateString()}
                  {exp.description ? ` · ${exp.description}` : ""}
                </p>
              </div>
              <p className="font-semibold">{Number(exp.amount).toLocaleString()} TZS</p>
            </div>
          ))
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Use the <Link href={`/workspaces/businesses/${businessId}/commerce/expenses`} className="text-primary underline">Commerce Expenses</Link> module to record new expenses.
      </p>
    </div>
  );
}
