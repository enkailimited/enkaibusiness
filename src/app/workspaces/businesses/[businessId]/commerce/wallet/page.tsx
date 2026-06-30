import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WalletView } from "@/features/subscriptions/wallet/components/wallet-view";
import { WalletTransactionList } from "@/features/subscriptions/wallet/components/wallet-transaction-list";
import { DepositForm } from "@/features/subscriptions/wallet/components/deposit-form";
import { requireAuth } from "@/server/auth";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function WalletPage({ params }: Props) {
  const { businessId } = await params;
  await requireAuth();

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Wallet" description="Manage subscription wallet and transactions" />

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-2xl" />}>
        <WalletView businessId={businessId} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
            <WalletTransactionList businessId={businessId} />
          </Suspense>
        </div>
        <div>
          <DepositForm businessId={businessId} />
        </div>
      </div>
    </div>
  );
}
