import "server-only";
import { prisma } from "@/server/db";

const DEFAULT_TASKS = [
  { name: "Site Assessment", category: "setup", description: "Evaluate premises for QR installation", sortOrder: 1 },
  { name: "Hardware Setup", category: "setup", description: "Install QR displays and hardware", sortOrder: 2 },
  { name: "System Configuration", category: "configuration", description: "Configure system settings", sortOrder: 3 },
  { name: "Catalog Setup", category: "catalog", description: "Set up product/service catalog", sortOrder: 4 },
  { name: "Payment Configuration", category: "payment", description: "Configure payment methods", sortOrder: 5 },
  { name: "QR Code Generation", category: "qr", description: "Generate QR codes for the business", sortOrder: 6 },
  { name: "Staff Training", category: "training", description: "Train staff on system usage", sortOrder: 7 },
  { name: "Testing", category: "testing", description: "Test all systems end-to-end", sortOrder: 8 },
];

export async function createDefaultTasks(ticketId: string) {
  return prisma.installationTask.createMany({
    data: DEFAULT_TASKS.map((t) => ({ ...t, ticketId })),
  });
}

export async function completeTask(taskId: string, completedById: string, notes?: string) {
  return prisma.installationTask.update({
    where: { id: taskId },
    data: { isCompleted: true, completedAt: new Date(), completedById, notes: notes || null },
  });
}

export async function uncompleteTask(taskId: string) {
  return prisma.installationTask.update({
    where: { id: taskId },
    data: { isCompleted: false, completedAt: null, completedById: null, notes: null },
  });
}

export async function addCustomTask(ticketId: string, name: string, category: string, description?: string) {
  const maxSort = await prisma.installationTask.findFirst({
    where: { ticketId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.installationTask.create({
    data: { ticketId, name, category, description: description || null, sortOrder: (maxSort?.sortOrder || 0) + 1 },
  });
}
