"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { createBusiness } from "@/server/services/business-service";
import { createBusinessSchema } from "@/lib/validations/business";
import type { ActionResponse } from "@/types/relationships";

export async function createBusinessAction(
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createBusinessSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    currency: formData.get("currency") || "TZS",
    timezone: formData.get("timezone") || "Africa/Dar_es_Salaam",
    taxId: formData.get("taxId") || undefined,
    industry: formData.get("industry"),
    modes: JSON.parse((formData.get("modes") as string) || "[]"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createBusiness(
    parsed.data,
    workspaceId,
    user.id,
  );

  if (result.success) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }

  return result;
}
