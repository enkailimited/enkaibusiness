import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireAuth } from "@/server/auth";
import { listQRCodes } from "@/features/qr-ordering/qr-codes/services/qr-code-service";
import { prisma } from "@/server/db";
import { formatDate } from "@/lib/utils";

interface Props { params: Promise<{ businessId: string }> }

const statusLabels: Record<string, string> = {
  INSTALLED: "Installed",
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned",
};

const statusVariants: Record<string, string> = {
  INSTALLED: "success",
  ASSIGNED: "warning",
  UNASSIGNED: "secondary",
};

async function QRCodeSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) notFound();

  const qrCodes = await listQRCodes({ businessId });

  return (
    <div className="space-y-4">
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <QrCode className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No QR codes installed at this business yet.</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              QR codes must be assigned and installed from a distribution campaign first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {qrCodes.map((qr) => (
            <Card key={qr.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{qr.code}</span>
                    <Badge
                      variant={(statusVariants[qr.status] ?? "secondary") as any}
                    >
                      {statusLabels[qr.status] ?? qr.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Campaign: {qr.campaign.name}
                    {qr.installedAt && ` | Installed ${formatDate(qr.installedAt)}`}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/workspaces/businesses/${businessId}/qr-ordering/${qr.id}/menu`}
                  >
                    Manage Menu
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function QROrderingPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="QR Menu"
        description="Manage QR codes and their menu items at this business"
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <QRCodeSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
