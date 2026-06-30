import "server-only";

import { prisma } from "@/server/db";
import { setBusinessSetting } from "@/features/businesses/services/setting-service";
import { hasPermission } from "@/features/roles/services/assignment-service";
import {
  type CreateBusinessInput,
  type BusinessRegistrationResult,
  type RegistrationResponse,
  success,
  failure,
} from "../shared";
import { emitBusinessCreated } from "../events";
import { CommerceResolver, DbBusinessTypeResolver, type BusinessTypeResolver, type BusinessPricingInfo } from "../resolvers";
import { createAuditLog } from "@/server/services/audit-service";
import { SubscriptionStatus } from "@prisma/client";
import { SubscriptionPlanResolver } from "@/server/services/subscription-plan-resolver";

export class BusinessRegistrationEngine {
  static async register(
    input: CreateBusinessInput,
    plan: { id: string; amount: number; interval: string; name: string },
    pricing?: BusinessPricingInfo,
    resolver?: BusinessTypeResolver,
  ): Promise<RegistrationResponse<BusinessRegistrationResult>> {
    const isWorkspaceOwner = await prisma.workspaceMember.findFirst({
      where: { userId: input.createdById, workspaceId: input.workspaceId, role: "OWNER" },
      select: { id: true },
    });
    if (!isWorkspaceOwner) {
      const has = await hasPermission(input.createdById, "businesses.create", input.workspaceId);
      if (!has) {
        return failure("You do not have the 'businesses.create' permission");
      }
    }

    try {
      const effectiveResolver = resolver
        || (input.businessTypeId ? new DbBusinessTypeResolver(input.businessTypeId) : undefined)
        || new CommerceResolver();
      const config = await effectiveResolver.getConfig();
      const effectivePricing = pricing || await effectiveResolver.getDefaultPricing();

      const { industry, modes, planId, businessSize, businessTypeId, branchId, storeId, ...businessData } = input;

      const subscriptionRequired = await effectiveResolver.requiresSubscription();

      const txResult = await prisma.$transaction(async (tx) => {
        const business = await tx.business.create({
          data: {
            ...businessData,
            businessTypeId: businessTypeId ?? null,
            status: "PENDING_SETUP",
            isActive: false,
            modes: {
              create: modes.map((mode) => ({
                industry,
                mode,
              })),
            },
          },
        });

        let ownerRole: { id: string; name: string; slug: string } | null = null;
        ownerRole = await tx.role.findUnique({ where: { slug: "owner" } });
        if (ownerRole) {
          const existing = await tx.userRole.findFirst({
            where: { userId: input.createdById, roleId: ownerRole.id, businessId: business.id },
          });
          if (!existing) {
            await tx.userRole.create({
              data: { userId: input.createdById, roleId: ownerRole.id, businessId: business.id },
            });
          }
        }

        let ownerStaffId: string | undefined;
        const existingStaff = await tx.staff.findFirst({
          where: { userId: input.createdById },
        });
        if (!existingStaff) {
          const staff = await tx.staff.create({
            data: {
              userId: input.createdById,
              businessId: business.id,
              position: config.defaultPosition,
              isActive: true,
            },
          });
          ownerStaffId = staff.id;
        } else {
          ownerStaffId = existingStaff.id;
        }

        const level = await effectiveResolver.resolveLevel({ branchId, storeId });

        const existingAssignment = await tx.staffAssignment.findFirst({
          where: { staffId: ownerStaffId, businessId: business.id },
        });
        if (!existingAssignment) {
          await tx.staffAssignment.create({
            data: {
              staffId: ownerStaffId,
              businessId: business.id,
              level,
              roleId: ownerRole?.id ?? null,
              isPrimary: true,
            },
          });
        }

        let subscriptionId: string | undefined;
        let walletId: string | undefined;

        if (subscriptionRequired) {
          const now = new Date();
          const endDate = SubscriptionPlanResolver.computeEndDate(plan.interval, now);
          const graceEndDate = SubscriptionPlanResolver.computeGraceEndDate(endDate);

          const subscription = await tx.subscription.create({
            data: {
              planId: plan.id,
              businessId: business.id,
              status: SubscriptionStatus.PENDING,
              startDate: now,
              endDate,
              graceEndDate,
            },
          });
          subscriptionId = subscription.id;

          const wallet = await tx.subscriptionWallet.create({
            data: {
              businessId: business.id,
              balance: 0,
              totalDeposited: 0,
              totalConsumed: 0,
            },
          });
          walletId = wallet.id;
        }

        const mainBranch = await tx.branch.create({
          data: {
            businessId: business.id,
            name: "Head Office",
            isHeadOffice: true,
            isActive: true,
          },
        });

        await tx.inventoryLocation.create({
          data: {
            businessId: business.id,
            branchId: mainBranch.id,
            name: `${mainBranch.name} - Main Store`,
            type: "store",
            isActive: true,
          },
        });

        const existingCustomer = await tx.customer.findFirst({
          where: { businessId: business.id, email: "walkin@internal" },
        });
        if (!existingCustomer) {
          await tx.customer.create({
            data: {
              businessId: business.id,
              firstName: "Walk-In",
              lastName: "Customer",
              email: "walkin@internal",
              customerType: "WALK_IN",
              isActive: true,
            },
          });
        }

        await tx.paymentMethod.upsert({
          where: { businessId_name: { businessId: business.id, name: "Cash" } },
          update: {},
          create: {
            businessId: business.id,
            name: "Cash",
            type: "cash",
            isActive: true,
          },
        });

        return { business, ownerStaffId, subscriptionId, walletId };
      });

      if (businessSize) {
        await setBusinessSetting(txResult.business.id, "business_size", businessSize, "string", "Business size category");
      }

      if (subscriptionRequired) {
        await setBusinessSetting(txResult.business.id, "daily_price", String(effectivePricing.dailyPrice), "number", "Calculated daily subscription price");
        await setBusinessSetting(txResult.business.id, "setup_fee", String(effectivePricing.totalSetupFee), "number", "One-time setup fee");
      }

      emitBusinessCreated(
        input.createdById,
        txResult.business.id,
        txResult.business.name,
        industry as string,
        modes,
        plan.name,
        txResult.subscriptionId,
      );

      await createAuditLog(input.createdById, "BUSINESS_REGISTERED", "Business", txResult.business.id, {
        after: {
          status: "PENDING_SETUP",
          planName: plan.name,
          subscriptionId: txResult.subscriptionId,
          setupFee: effectivePricing.totalSetupFee,
        },
      });

      if (txResult.subscriptionId) {
        await createAuditLog(input.createdById, "SUBSCRIPTION_CREATED", "Subscription", txResult.subscriptionId, {
          after: {
            status: SubscriptionStatus.PENDING,
            planName: plan.name,
            businessId: txResult.business.id,
          },
        });
      }

      if (txResult.walletId) {
        await createAuditLog(input.createdById, "WALLET_CREATED", "SubscriptionWallet", txResult.walletId, {
          after: {
            businessId: txResult.business.id,
            balance: 0,
          },
        });
      }

      return success<BusinessRegistrationResult>(
        `Business "${txResult.business.name}" created successfully with ${plan.name}`,
        {
          businessId: txResult.business.id,
          subscriptionId: txResult.subscriptionId ?? "",
          walletId: txResult.walletId ?? null,
          ownerStaffId: txResult.ownerStaffId,
        },
      );
    } catch (error) {
      console.error("BusinessRegistrationEngine.register error", error);
      return failure("Failed to create business");
    }
  }
}
