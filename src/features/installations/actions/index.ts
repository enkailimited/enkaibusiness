"use server";

import { prisma } from "@/server/db";
import {
  createInstallationTicket,
  updateInstallationStatus,
  assignDistributor,
} from "../services/installation-service";
import { createDefaultTasks, completeTask, uncompleteTask, addCustomTask } from "../services/task-service";

export async function createTicketAction(_prev: unknown, formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string;
    const branchId = (formData.get("branchId") as string) || undefined;
    const requestedById = formData.get("requestedById") as string;
    const type = (formData.get("type") as string) || "NEW_BUSINESS";
    const notes = (formData.get("notes") as string) || undefined;

    const ticket = await createInstallationTicket({ businessId, branchId, type, requestedById, notes });
    await createDefaultTasks(ticket.id);

    return { success: true, message: "Installation ticket created", data: { id: ticket.id, ticketNumber: ticket.ticketNumber } };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to create ticket" };
  }
}

export async function updateStatusAction(ticketId: string, newStatus: string) {
  try {
    const result = await updateInstallationStatus(ticketId, newStatus, "");
    return result;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update status" };
  }
}

export async function completeTaskAction(taskId: string, notes?: string) {
  try {
    await completeTask(taskId, "", notes);
    return { success: true, message: "Task completed" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to complete task" };
  }
}

export async function uncompleteTaskAction(taskId: string) {
  try {
    await uncompleteTask(taskId);
    return { success: true, message: "Task reopened" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to reopen task" };
  }
}

export async function addCustomTaskAction(_prev: unknown, formData: FormData) {
  try {
    const ticketId = formData.get("ticketId") as string;
    const name = formData.get("name") as string;
    const category = (formData.get("category") as string) || "setup";
    const description = (formData.get("description") as string) || undefined;

    await addCustomTask(ticketId, name, category, description);
    return { success: true, message: "Task added" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to add task" };
  }
}

export async function assignDistributorAction(ticketId: string, distributorId: string, assignedById: string) {
  try {
    return await assignDistributor(ticketId, distributorId, assignedById);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to assign" };
  }
}

export async function getDistributorsAction() {
  try {
    return prisma.distributor.findMany({
      where: { status: { in: ["ACTIVE", "AVAILABLE"] } },
      select: { id: true, firstName: true, lastName: true, region: true, currentLoad: true, maxAssignments: true },
      orderBy: { firstName: "asc" },
    });
  } catch {
    return [];
  }
}

export async function approveInstallationAction(ticketId: string, approved: boolean, notes?: string) {
  try {
    if (approved) {
      const result = await updateInstallationStatus(ticketId, "ACTIVATED", "");
      if (!result.success) return result;
    }
    await prisma.installationTicket.update({
      where: { id: ticketId },
      data: { ownerApproved: approved, ownerApprovedAt: approved ? new Date() : null, verificationNotes: notes || null },
    });
    return { success: true, message: approved ? "Installation approved and activated" : "Installation declined" };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to process approval" };
  }
}
