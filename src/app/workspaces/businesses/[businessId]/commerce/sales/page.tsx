import { PageHeader } from "@/components/layout/page-header";
import { SaleList } from "@/features/sales/components/sale-list";

interface Props { params: Promise<{ businessId: string }> }

export default async function SalesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Sales" description="Use POS for new sales. View historical transactions here." />
      <SaleList businessId={businessId} />
    </div>
  );
}
