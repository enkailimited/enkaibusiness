import "server-only";

import { prisma } from "@/server/db";

export type WorkflowModule = "purchase-order" | "expense" | "return" | "stock-adjustment" | "quotation";
export type WorkflowTriggerEvent = "created" | "status-changed" | "amount-exceeded";
export type ApprovalActionType = "approved" | "rejected" | "returned";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface StageDefinition {
  name: string;
  stageOrder: number;
  approverRole: string;
  minApprovers: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  module: WorkflowModule;
  triggerEvent: WorkflowTriggerEvent;
  triggerConfig: Record<string, unknown>;
  stages: StageDefinition[];
}

export interface ApprovalActionInput {
  requestId: string;
  approverId: string;
  action: ApprovalActionType;
  comment?: string;
}

export class WorkflowEngine {
  async findMatchingWorkflows(
    businessId: string,
    module: WorkflowModule,
    triggerEvent: WorkflowTriggerEvent,
    context: { status?: string; amount?: number },
  ): Promise<WorkflowDefinition[]> {
    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        businessId,
        module,
        triggerEvent,
        isActive: true,
      },
      include: {
        stages: {
          where: { isActive: true },
          orderBy: { stageOrder: "asc" },
        },
      },
    });

    const filtered: WorkflowDefinition[] = [];

    for (const wf of workflows) {
      const config = wf.triggerConfig as Record<string, unknown>;

      if (triggerEvent === "amount-exceeded") {
        const threshold = Number(config.threshold ?? 0);
        if (!context.amount || context.amount < threshold) continue;
      }

      if (triggerEvent === "status-changed") {
        const targetStatus = config.status as string | undefined;
        if (targetStatus && context.status !== targetStatus) continue;
      }

      filtered.push({
        id: wf.id,
        name: wf.name,
        module: wf.module as WorkflowModule,
        triggerEvent: wf.triggerEvent as WorkflowTriggerEvent,
        triggerConfig: config,
        stages: wf.stages.map((s) => ({
          name: s.name,
          stageOrder: s.stageOrder,
          approverRole: s.approverRole,
          minApprovers: s.minApprovers,
        })),
      });
    }

    return filtered;
  }

  async initiateApproval(params: {
    businessId: string;
    workflowId: string;
    referenceId: string;
    referenceType: string;
    requestedById: string;
    notes?: string;
  }): Promise<{ requestId: string }> {
    const request = await prisma.approvalRequest.create({
      data: {
        businessId: params.businessId,
        workflowId: params.workflowId,
        referenceId: params.referenceId,
        referenceType: params.referenceType,
        requestedById: params.requestedById,
        status: "pending",
        currentStage: 0,
        notes: params.notes,
      },
    });

    return { requestId: request.id };
  }

  async getRequest(requestId: string) {
    return prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        workflow: { include: { stages: { orderBy: { stageOrder: "asc" } } } },
        actions: { include: { approver: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  async processAction(input: ApprovalActionInput): Promise<{ status: ApprovalStatus; currentStage: number }> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: input.requestId },
      include: { workflow: { include: { stages: { where: { isActive: true }, orderBy: { stageOrder: "asc" } } } } },
    });

    if (!request) throw new Error(`Approval request ${input.requestId} not found`);
    if (request.status !== "pending") throw new Error("Request is no longer pending");

    const currentStage = request.currentStage;
    const stage = request.workflow.stages.find((s) => s.stageOrder === currentStage);
    if (!stage) throw new Error(`Stage ${currentStage} not found in workflow`);

    const existingActions = await prisma.approvalAction.count({
      where: { requestId: input.requestId, stage: currentStage },
    });

    await prisma.approvalAction.create({
      data: {
        requestId: input.requestId,
        approverId: input.approverId,
        stage: currentStage,
        action: input.action,
        comment: input.comment,
      },
    });

    if (input.action === "rejected") {
      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: { status: "rejected" },
      });
      return { status: "rejected", currentStage };
    }

    if (input.action === "returned") {
      await prisma.approvalRequest.update({
        where: { id: input.requestId },
        data: { status: "rejected" },
      });
      return { status: "rejected", currentStage };
    }

    const newApprovalCount = existingActions + 1;

    if (newApprovalCount >= stage.minApprovers) {
      const nextStage = request.workflow.stages.find((s) => s.stageOrder === currentStage + 1);

      if (nextStage) {
        await prisma.approvalRequest.update({
          where: { id: input.requestId },
          data: { currentStage: nextStage.stageOrder },
        });
        return { status: "pending", currentStage: nextStage.stageOrder };
      } else {
        await prisma.approvalRequest.update({
          where: { id: input.requestId },
          data: { status: "approved", currentStage },
        });
        return { status: "approved", currentStage };
      }
    }

    return { status: "pending", currentStage };
  }

  async cancelRequest(requestId: string, userId: string): Promise<void> {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error(`Request ${requestId} not found`);
    if (request.status !== "pending") throw new Error("Can only cancel pending requests");

    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "cancelled" },
    });
  }

  async getPendingRequestsForUser(
    userId: string,
    businessId: string,
  ): Promise<Array<{ id: string; referenceType: string; referenceId: string; status: string; currentStage: number; createdAt: Date }>> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { slug: true } } },
    });
    const roleSlugs = userRoles.map((ur) => ur.role.slug);

    const workflows = await prisma.approvalWorkflow.findMany({
      where: { businessId, isActive: true },
      include: {
        stages: { where: { isActive: true, approverRole: { in: roleSlugs } } },
      },
    });

    const workflowIds = workflows.filter((w) => w.stages.length > 0).map((w) => w.id);

    const requests = await prisma.approvalRequest.findMany({
      where: {
        businessId,
        workflowId: { in: workflowIds },
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return requests.map((r) => ({
      id: r.id,
      referenceType: r.referenceType,
      referenceId: r.referenceId,
      status: r.status,
      currentStage: r.currentStage,
      createdAt: r.createdAt,
    }));
  }
}

export const workflowEngine = new WorkflowEngine();
