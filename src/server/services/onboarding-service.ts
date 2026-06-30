import "server-only";

import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import { OnboardingStep } from "@/types/enums";
import { UserRegistrationEngine, BusinessRegistrationEngine } from "@/server/registrations";
import { RegistrationContext } from "@/server/registrations/context";
import { ensureRbacWorkspaceRole } from "@/features/workspaces/services/workspace-service";
import { SubscriptionPlanResolver } from "@/server/services/subscription-plan-resolver";

export interface OnboardingStepInfo {
  step: OnboardingStep;
  label: string;
  order: number;
}

const ONBOARDING_STEPS: OnboardingStepInfo[] = [
  { step: OnboardingStep.LEAD_CREATED, label: "Lead Created", order: 1 },
  { step: OnboardingStep.CONTACTED, label: "Contact Made", order: 2 },
  { step: OnboardingStep.CONVERTED, label: "Converted", order: 3 },
  { step: OnboardingStep.WORKSPACE_CREATED, label: "Workspace Created", order: 4 },
  { step: OnboardingStep.BUSINESS_CREATED, label: "Business Created", order: 5 },
  { step: OnboardingStep.OWNER_ASSIGNED, label: "Owner Assigned", order: 6 },
  { step: OnboardingStep.TRAINING_COMPLETED, label: "Training Completed", order: 7 },
  { step: OnboardingStep.ACTIVE_CUSTOMER, label: "Active Customer", order: 8 },
];

export async function getOnboardingSteps(): Promise<OnboardingStepInfo[]> {
  return ONBOARDING_STEPS;
}

export async function getOnboardingProgress(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!lead) return null;

  let currentStep: OnboardingStep;

  if (lead.convertedToUserId) {
    const user = await prisma.user.findUnique({
      where: { id: lead.convertedToUserId },
      include: {
        workspaceMemberships: {
          include: {
            workspace: {
              include: {
                _count: { select: { businesses: true } },
              },
            },
          },
        },
      },
    });

    const hasWorkspace = user && user.workspaceMemberships.length > 0;
    const hasBusiness =
      user?.workspaceMemberships.some(
        (wm) => wm.workspace._count.businesses > 0,
      ) ?? false;

    if (hasBusiness) {
      currentStep = OnboardingStep.BUSINESS_CREATED;
    } else if (hasWorkspace) {
      currentStep = OnboardingStep.WORKSPACE_CREATED;
    } else {
      currentStep = OnboardingStep.CONVERTED;
    }
  } else if (
    lead.status === "CONTACTED" ||
    lead.status === "INTERESTED" ||
    lead.status === "DEMO" ||
    lead.status === "NEGOTIATION"
  ) {
    currentStep = OnboardingStep.CONTACTED;
  } else {
    currentStep = OnboardingStep.LEAD_CREATED;
  }

  const currentIndex = ONBOARDING_STEPS.findIndex(
    (s) => s.step === currentStep,
  );

  return {
    leadId: lead.id,
    leadName: `${lead.firstName} ${lead.lastName}`,
    leadStatus: lead.status,
    currentStep,
    currentStepIndex: currentIndex,
    totalSteps: ONBOARDING_STEPS.length,
    progress: Math.round(((currentIndex + 1) / ONBOARDING_STEPS.length) * 100),
    steps: ONBOARDING_STEPS.map((step, i) => ({
      ...step,
      isCompleted: i <= currentIndex,
      isCurrent: i === currentIndex,
    })),
  };
}

export async function advanceStep(
  leadId: string,
  step: OnboardingStep,
): Promise<ActionResponse> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    const stepMap: Record<OnboardingStep, string | null> = {
      [OnboardingStep.LEAD_CREATED]: "NEW",
      [OnboardingStep.CONTACTED]: "CONTACTED",
      [OnboardingStep.CONVERTED]: "CONVERTED",
      [OnboardingStep.WORKSPACE_CREATED]: null,
      [OnboardingStep.BUSINESS_CREATED]: null,
      [OnboardingStep.OWNER_ASSIGNED]: null,
      [OnboardingStep.TRAINING_COMPLETED]: null,
      [OnboardingStep.ACTIVE_CUSTOMER]: null,
    };

    const targetStatus = stepMap[step];

    if (targetStatus) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: targetStatus as LeadStatus },
      });

      await prisma.leadActivity.create({
        data: {
          leadId,
          action: "ONBOARDING_ADVANCE",
          detail: `Onboarding advanced to ${step} (status: ${targetStatus})`,
          createdById: lead.assignedToId || null,
        },
      });
    }

    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "ONBOARDING_ADVANCE",
        detail: `Onboarding advanced to step: ${step}`,
      },
    });

    return { success: true, message: `Advanced to step: ${step}` };
  } catch (error) {
    console.error("Advance onboarding step error:", error);
    return { success: false, message: "Failed to advance onboarding step" };
  }
}

export async function createWorkspaceForLead(
  leadId: string,
): Promise<
  ActionResponse & { data?: { workspaceId: string; businessId: string } }
> {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    const userEmail = lead.email;
    if (!userEmail) {
      return { success: false, message: "Lead has no email address" };
    }

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      const userResult = await UserRegistrationEngine.register(
        RegistrationContext.WORKSPACE,
        lead.assignedToId || "system",
        {
          email: userEmail,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone || undefined,
          invite: false,
        },
      );
      if (!userResult.success) {
        return { success: false, message: userResult.message };
      }
      user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) {
        return { success: false, message: "User was created but could not be retrieved" };
      }
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: `${lead.firstName} ${lead.lastName}'s Workspace`,
        slug: `${lead.firstName.toLowerCase()}-${lead.lastName.toLowerCase()}-${Date.now()}`,
        description: `Workspace created from lead: ${lead.firstName} ${lead.lastName}`,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    await ensureRbacWorkspaceRole(user.id, "OWNER");

    const defaultPlan = await SubscriptionPlanResolver.getDefaultPlan();

    if (!defaultPlan) {
      return { success: false, message: "No active subscription plan found. Please contact administrator." };
    }

    const dailyRate = Number(defaultPlan.amount) / (defaultPlan.interval === "WEEKLY" ? 7 : defaultPlan.interval === "MONTHLY" ? 30 : 1);
    const { calculateDailyPrice, calculateSetupFee } = await import("@/features/subscriptions/constants/pricing");
    const dailyPrice = calculateDailyPrice(dailyRate, "small", false);
    const { total: totalSetupFee } = calculateSetupFee(false, ["retail"]);

    const bizResult = await BusinessRegistrationEngine.register(
      {
        name: lead.businessName || `${lead.firstName} ${lead.lastName}'s Business`,
        slug: `${lead.firstName.toLowerCase()}-${lead.lastName.toLowerCase()}-business`,
        workspaceId: workspace.id,
        createdById: user.id,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        industry: "RETAIL" as any,
        modes: ["retail"],
        planId: defaultPlan.id,
        businessSize: "small",
      },
      {
        id: defaultPlan.id,
        amount: defaultPlan.amount,
        interval: defaultPlan.interval,
        name: defaultPlan.name,
      },
      { dailyPrice, setupFee: 0, qrPrintingFee: 0, totalSetupFee },
    );

    if (!bizResult.success) {
      return { success: false, message: bizResult.message };
    }

    if (lead.status !== "CONVERTED") {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: "CONVERTED",
          convertedToUserId: user.id,
          convertedAt: new Date(),
        },
      });
    }

    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "WORKSPACE_CREATED",
        detail: `Workspace "${workspace.name}" and business created`,
        createdById: user.id,
      },
    });

    return {
      success: true,
      message: "Workspace and business created successfully",
      data: { workspaceId: workspace.id, businessId: bizResult.data!.businessId },
    };
  } catch (error) {
    console.error("Create workspace for lead error:", error);
    return { success: false, message: "Failed to create workspace for lead" };
  }
}

export async function getOnboardingMetrics() {
  const allLeads = await prisma.lead.findMany({
    select: {
      id: true,
      status: true,
      convertedToUserId: true,
      convertedAt: true,
    },
  });

  const stepCounts = new Map<string, number>();
  for (const step of ONBOARDING_STEPS) {
    stepCounts.set(step.step, 0);
  }

  for (const lead of allLeads) {
    if (lead.convertedToUserId) {
      const user = await prisma.user.findUnique({
        where: { id: lead.convertedToUserId },
        include: {
          workspaceMemberships: {
            include: {
              workspace: {
                include: {
                  _count: { select: { businesses: true } },
                },
              },
            },
          },
        },
      });

      const hasWorkspace = user !== null && user.workspaceMemberships.length > 0;
      const hasBusiness =
        user !== null &&
        user.workspaceMemberships.some(
          (wm) => wm.workspace._count.businesses > 0,
        );

      if (hasBusiness) {
        stepCounts.set(OnboardingStep.BUSINESS_CREATED, (stepCounts.get(OnboardingStep.BUSINESS_CREATED) ?? 0) + 1);
      } else if (hasWorkspace) {
        stepCounts.set(OnboardingStep.WORKSPACE_CREATED, (stepCounts.get(OnboardingStep.WORKSPACE_CREATED) ?? 0) + 1);
      } else {
        stepCounts.set(OnboardingStep.CONVERTED, (stepCounts.get(OnboardingStep.CONVERTED) ?? 0) + 1);
      }
    } else if (
      lead.status === "CONTACTED" ||
      lead.status === "INTERESTED" ||
      lead.status === "DEMO" ||
      lead.status === "NEGOTIATION"
    ) {
      stepCounts.set(OnboardingStep.CONTACTED, (stepCounts.get(OnboardingStep.CONTACTED) ?? 0) + 1);
    } else {
      stepCounts.set(OnboardingStep.LEAD_CREATED, (stepCounts.get(OnboardingStep.LEAD_CREATED) ?? 0) + 1);
    }
  }

  return {
    steps: ONBOARDING_STEPS.map((s) => ({
      step: s.step,
      label: s.label,
      count: stepCounts.get(s.step) ?? 0,
    })),
    totalLeads: allLeads.length,
  };
}
