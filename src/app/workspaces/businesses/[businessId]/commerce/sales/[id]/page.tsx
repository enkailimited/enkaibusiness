import { PageHeader } from "@/components/layout/page-header";
import { SaleDetail } from "@/features/sales";

interface Props { params: Promise<{ businessId: string; id: string }> }

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Sale Details" />
      <SaleDetail id={id} />
    </div>
  );
}
