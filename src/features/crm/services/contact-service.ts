import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { CreateContactSchema, UpdateContactSchema } from "../schemas";
import type { ContactWithRelations } from "../types";

export async function createContact(
  businessId: string,
  data: CreateContactSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { organizationId, metadata, ...rest } = data;

    const contact = await prisma.contact.create({
      data: {
        ...rest,
        businessId,
        organizationId: organizationId || null,
        metadata: metadata ?? undefined,
      },
    });

    return {
      success: true,
      message: "Contact created successfully",
      data: { id: contact.id },
    };
  } catch (error) {
    console.error("Create contact error:", error);
    return { success: false, message: "Failed to create contact" };
  }
}

export async function updateContact(
  id: string,
  data: UpdateContactSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { organizationId, metadata, ...rest } = data;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        organizationId: organizationId === "" ? null : organizationId,
        metadata: metadata ?? undefined,
      },
    });

    return {
      success: true,
      message: "Contact updated successfully",
      data: { id: contact.id },
    };
  } catch (error) {
    console.error("Update contact error:", error);
    return { success: false, message: "Failed to update contact" };
  }
}

export async function getContact(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      organization: true,
      addresses: true,
    },
  });
}

export async function listContacts(businessId: string) {
  return prisma.contact.findMany({
    where: { businessId, isActive: true },
    include: {
      organization: true,
      _count: { select: { addresses: true, communicationLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteContact(id: string): Promise<ActionResponse> {
  try {
    await prisma.contact.delete({ where: { id } });
    return { success: true, message: "Contact deleted successfully" };
  } catch (error) {
    console.error("Delete contact error:", error);
    return { success: false, message: "Failed to delete contact" };
  }
}
