import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseList } from "@/features/expenses/components/expense-list";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listCategories } from "@/features/expense-categories/services/category-service";

interface Props { params: Promise<{ businessId: string }> }

async function ExpenseSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const categories = await listCategories(businessId);
  return <ExpenseForm businessId={businessId} categories={categories} />;
}

export default async function ExpensesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Expenses" description="Track and manage business expenses">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <ExpenseSection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <ExpenseList businessId={businessId} />
      </Suspense>
    </div>
  );
}
