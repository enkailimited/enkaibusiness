import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/server/auth";
import { getCustomer } from "@/features/customers/services/customer-service";
import { CUSTOMER_TYPE_LABELS } from "@/features/customers/constants";

interface Props { params: Promise<{ businessId: string; customerId: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { businessId, customerId } = await params;
  await requireAuth();
  const customer = await getCustomer(customerId);
  if (!customer) notFound();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={`${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`}
        description={`${CUSTOMER_TYPE_LABELS[customer.customerType]} customer`}
      >
        <Button asChild>
          <Link href={`/workspaces/businesses/${businessId}/commerce/customers/${customerId}/statement`}>
            Statement
          </Link>
        </Button>
      </PageHeader>
      <div className="rounded-xl border p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="font-medium">{customer.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="font-medium">{customer.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Address</dt>
            <dd className="font-medium">{customer.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">City</dt>
            <dd className="font-medium">{customer.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Credit Limit</dt>
            <dd className="font-medium">
              {new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(customer.creditLimit)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="font-medium">{customer.isActive ? "Active" : "Inactive"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
