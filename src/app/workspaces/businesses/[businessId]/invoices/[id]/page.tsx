import { PageHeader } from "@/components/layout/page-header";
import { InvoiceDetail } from "@/features/invoices/components/invoice-detail";

interface Props { params: Promise<{ businessId: string; id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Invoice Details" />
      <InvoiceDetail id={id} />
    </div>
  );
}
