import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getQRCode } from "@/features/qr-ordering/qr-codes/services/qr-code-service";
import { prisma } from "@/server/db";
import { MenuList } from "@/features/qr-ordering/qr-menus/components/menu-list";
import { MenuForm } from "@/features/qr-ordering/qr-menus/components/menu-form";
import { DialogForm } from "@/components/ui/dialog-form";

interface Props { params: Promise<{ businessId: string; qrCodeId: string }> }

async function MenuSection({ businessId, qrCodeId }: { businessId: string; qrCodeId: string }) {
  await requireAuth();
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) notFound();

  const qrCode = await getQRCode(qrCodeId);
  if (!qrCode) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">QR Code</dt>
            <dd className="font-mono font-medium">{qrCode.code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Campaign</dt>
            <dd>{qrCode.campaign.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{qrCode.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Installed At</dt>
            <dd>{qrCode.installedAt?.toLocaleDateString() ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Menu Items</h2>
        <DialogForm
          title="Add Menu Item"
          description="Link a catalog item to this QR code"
          triggerLabel="Add Item"
        >
          <MenuForm businessId={businessId} qrCodeId={qrCodeId} />
        </DialogForm>
      </div>

      <MenuList qrCodeId={qrCodeId} />
    </div>
  );
}

export default async function MenuPage({ params }: Props) {
  const { businessId, qrCodeId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Menu Management"
        description="Manage items displayed on this QR code menu"
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <MenuSection businessId={businessId} qrCodeId={qrCodeId} />
      </Suspense>
    </div>
  );
}
