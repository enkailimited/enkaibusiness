import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/server/auth";
import { getSupplier } from "@/features/suppliers/services/supplier-service";
import { SUPPLIER_TYPE_LABELS } from "@/features/suppliers/constants";

interface Props { params: Promise<{ businessId: string; supplierId: string }> }

export default async function SupplierDetailPage({ params }: Props) {
  const { businessId, supplierId } = await params;
  await requireAuth();
  const supplier = await getSupplier(supplierId);
  if (!supplier) notFound();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={supplier.name}
        description={`${SUPPLIER_TYPE_LABELS[supplier.supplierType as keyof typeof SUPPLIER_TYPE_LABELS] || supplier.supplierType} supplier`}
      >
        <Button asChild>
          <Link href={`/workspaces/businesses/${businessId}/commerce/suppliers/${supplierId}/statement`}>
            Statement
          </Link>
        </Button>
      </PageHeader>
      <div className="rounded-xl border p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="font-medium">{supplier.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="font-medium">{supplier.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Address</dt>
            <dd className="font-medium">{supplier.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">City</dt>
            <dd className="font-medium">{supplier.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Country</dt>
            <dd className="font-medium">{supplier.country || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Currency</dt>
            <dd className="font-medium">{supplier.currency}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Payment Terms</dt>
            <dd className="font-medium">{supplier.paymentTerms || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="font-medium">{supplier.isActive ? "Active" : "Inactive"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
