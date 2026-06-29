"use client";

import { useQuery } from "@tanstack/react-query";
import { use, Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { listGoodsReceivedAction } from "@/features/goods-received/actions";
import { GoodsReceivedList } from "@/features/goods-received/components/goods-received-list";
import { GoodsReceivedForm } from "@/features/goods-received/components/goods-received-form";
import type { GoodsReceivedWithRelations } from "@/features/goods-received/types";

interface Props { params: Promise<{ businessId: string }> }

function GoodsReceivedContent({ businessId }: { businessId: string }) {
  const query = useQuery({
    queryKey: ["goods-received", businessId],
    queryFn: async () => {
      const result = await listGoodsReceivedAction(businessId);
      return (result ?? []) as GoodsReceivedWithRelations[];
    },
  });

  return (
    <>
      <PageHeader title="Goods Received" description="View received goods">
        <DialogForm title="Record Goods Received" description="Record received goods">
          <GoodsReceivedForm businessId={businessId} />
        </DialogForm>
      </PageHeader>
      {query.isPending ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <GoodsReceivedList items={query.data ?? []} />
      )}
    </>
  );
}

export default function GoodsReceivedPage({ params }: Props) {
  const { businessId } = use(params);
  return (
    <div className="space-y-6 pb-10">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <GoodsReceivedContent businessId={businessId} />
      </Suspense>
    </div>
  );
}
