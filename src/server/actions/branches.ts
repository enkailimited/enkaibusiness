"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createBranch, deleteBranch } from "@/server/services/branch-service";
import { createBranchSchema } from "@/lib/validations/branch";
import type { ActionResponse } from "@/types/relationships";

export async function createBranchAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = createBranchSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || "Tanzania",
    postalCode: formData.get("postalCode") || undefined,
    isHeadOffice: formData.get("isHeadOffice") === "true",
    openingTime: formData.get("openingTime") || undefined,
    closingTime: formData.get("closingTime") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createBranch(businessId, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/branches`);
  }

  return result;
}

export async function deleteBranchAction(businessId: string, branchId: string) {
  await requireAuth();
  const result = await deleteBranch(branchId);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/branches`);
  }

  return result;
}
