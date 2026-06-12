import "server-only";

import { prisma } from "@/server/db";
import type { WorkflowType, WorkflowStep } from "./workflow-engine";

export type PersistentWorkflowStatus = "STARTED" | "COLLECTING_DATA" | "VALIDATING" | "EXECUTING" | "COMPLETED" | "FAILED";

export interface PersistentWorkflow {
  id: string;
  businessId: string;
  userId: string;
  type: WorkflowType;
  status: PersistentWorkflowStatus;
  currentStep: WorkflowStep;
  collectedData: Record<string, unknown>;
  context: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrCreateWorkflow(
  businessId: string,
  userId: string,
  type: WorkflowType,
): Promise<PersistentWorkflow> {
  const existing = await prisma.firdausWorkflow.findFirst({
    where: {
      businessId,
      userId,
      type,
      status: { in: ["STARTED", "COLLECTING_DATA", "VALIDATING"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return {
      id: existing.id,
      businessId: existing.businessId,
      userId: existing.userId,
      type: existing.type as WorkflowType,
      status: existing.status as PersistentWorkflowStatus,
      currentStep: existing.currentStep as WorkflowStep,
      collectedData: (existing.collectedData || {}) as Record<string, unknown>,
      context: (existing.context || {}) as Record<string, unknown>,
      error: existing.error || undefined,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const created = await prisma.firdausWorkflow.create({
    data: {
      businessId,
      userId,
      type,
      status: "STARTED",
      currentStep: "",
      collectedData: {},
      context: {},
    },
  });

  return {
    id: created.id,
    businessId: created.businessId,
    userId: created.userId,
    type: created.type as WorkflowType,
    status: created.status as PersistentWorkflowStatus,
    currentStep: created.currentStep as WorkflowStep,
    collectedData: {},
    context: {},
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function saveWorkflowStep(
  id: string,
  step: WorkflowStep,
  status: PersistentWorkflowStatus,
): Promise<void> {
  await prisma.firdausWorkflow.update({
    where: { id },
    data: { currentStep: step, status, updatedAt: new Date() },
  });
}

export async function setWorkflowParam(
  id: string,
  key: string,
  value: unknown,
): Promise<Record<string, unknown>> {
  const wf = await prisma.firdausWorkflow.findUnique({ where: { id } });
  if (!wf) throw new Error("Workflow not found");

  const data = (wf.collectedData || {}) as Record<string, unknown>;
  data[key] = value;

  await prisma.firdausWorkflow.update({
    where: { id },
    data: { collectedData: data, status: "COLLECTING_DATA" },
  });
  return data;
}

export async function completeWorkflow(id: string): Promise<void> {
  await prisma.firdausWorkflow.update({
    where: { id },
    data: { status: "COMPLETED", updatedAt: new Date() },
  });
}

export async function failWorkflow(id: string, error: string): Promise<void> {
  await prisma.firdausWorkflow.update({
    where: { id },
    data: { status: "FAILED", error, updatedAt: new Date() },
  });
}

export async function validateWorkflow(id: string): Promise<void> {
  await prisma.firdausWorkflow.update({
    where: { id },
    data: { status: "VALIDATING", updatedAt: new Date() },
  });
}

export async function executeWorkflow(id: string): Promise<void> {
  await prisma.firdausWorkflow.update({
    where: { id },
    data: { status: "EXECUTING", updatedAt: new Date() },
  });
}

export async function getActiveWorkflow(
  businessId: string,
  userId: string,
): Promise<PersistentWorkflow | null> {
  const wf = await prisma.firdausWorkflow.findFirst({
    where: {
      businessId,
      userId,
      status: { in: ["STARTED", "COLLECTING_DATA", "VALIDATING", "EXECUTING"] },
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!wf) return null;
  return {
    id: wf.id,
    businessId: wf.businessId,
    userId: wf.userId,
    type: wf.type as WorkflowType,
    status: wf.status as PersistentWorkflowStatus,
    currentStep: wf.currentStep as WorkflowStep,
    collectedData: (wf.collectedData || {}) as Record<string, unknown>,
    context: (wf.context || {}) as Record<string, unknown>,
    error: wf.error || undefined,
    createdAt: wf.createdAt,
    updatedAt: wf.updatedAt,
  };
}
