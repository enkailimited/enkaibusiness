import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function MiningSalesPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true, name: true } });
  if (!business) notFound();

  const sales = await prisma.sale.findMany({
    where: { businessId },
    orderBy: { saleDate: "desc" },
    take: 50,
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });

  const aggregate = await prisma.sale.aggregate({
    where: { businessId },
    _sum: { grandTotal: true },
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mineral Sales</h1>
        <p className="text-muted-foreground">Track mineral sales and off-take agreements</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">{aggregate._count}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{Number(aggregate._sum.grandTotal || 0).toLocaleString()} TZS</p></div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Avg per Sale</p>
          <p className="text-2xl font-bold">
            {aggregate._count > 0 ? Math.round(Number(aggregate._sum.grandTotal || 0) / aggregate._count).toLocaleString() : 0} TZS
          </p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">Sales ({sales.length})</h3></div>
        {sales.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          sales.map((sale: any) => (
            <div key={sale.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{sale.reference || sale.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sale.saleDate).toLocaleDateString()}
                  {sale.customer?.name ? ` · ${sale.customer.name}` : ""}
                  {sale._count?.items ? ` · ${sale._count.items} items` : ""}
                </p>
              </div>
              <p className="font-semibold">{Number(sale.grandTotal).toLocaleString()} TZS</p>
            </div>
          ))
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Use the <Link href={`/workspaces/businesses/${businessId}/commerce/sales`} className="text-primary underline">Commerce Sales</Link> module to create new mineral sales transactions.
      </p>
    </div>
  );
}
