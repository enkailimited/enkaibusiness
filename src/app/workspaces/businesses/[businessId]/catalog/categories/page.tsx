import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryList } from "@/features/catalog/categories/components/category-list";
import { CategoryForm } from "@/features/catalog/categories/components/category-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getBusinessCategories } from "@/features/catalog/categories/services/category-service";

interface Props { params: Promise<{ businessId: string }> }

async function CategoryFormDialog({ businessId }: { businessId: string }) {
  await requireAuth();
  const categories = await getBusinessCategories(businessId);
  const flatCategories = categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }));
  return (
    <DialogForm title="Add Category" description="Add a new category">
      <CategoryForm mode="create" businessId={businessId} categories={flatCategories} />
    </DialogForm>
  );
}

export default async function CategoriesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Categories" description="Organize products into categories">
        <Suspense fallback={<Skeleton className="h-10 w-28 rounded-lg" />}>
          <CategoryFormDialog businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <CategoryList businessId={businessId} />
      </Suspense>
    </div>
  );
}
