import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryList } from "@/features/catalog/categories/components/category-list";
import { CategoryForm } from "@/features/catalog/categories/components/category-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getBusinessCategories } from "@/features/catalog/categories/services/category-service";

interface Props { params: Promise<{ businessId: string }> }

async function CategorySection({ businessId }: { businessId: string }) {
  await requireAuth();
  const all = await getBusinessCategories(businessId);
  const flat = all.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }));
  return (
    <CategoryForm mode="create" businessId={businessId} categories={flat} />
  );
}

export default async function CategoriesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Categories" description="Organize products into categories">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <CategorySection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <CategoryList businessId={businessId} />
      </Suspense>
    </div>
  );
}
