import "server-only";

import { createNotification } from "@/features/notifications/services/notification-service";
import { recordActivity } from "@/features/activities/services/activity-service";
import { firdausEventBus, registerDefaultHandlers } from "@/modules/ai/events/event-bus";

// ─── Emit helpers ───────────────────────────────────────────────────────

export function emitUserRegistered(
  businessId: string,
  userId: string,
  invitedById: string,
  email: string,
  context: string,
): void {
  firdausEventBus.emit({
    type: "UserRegistered",
    businessId,
    userId,
    entityId: userId,
    data: { invitedById, email, context },
    timestamp: new Date(),
  });
}

export function emitUserAssignedToContext(
  businessId: string,
  userId: string,
  invitedById: string,
  email: string,
  context: string,
): void {
  firdausEventBus.emit({
    type: "UserAssignedToContext",
    businessId,
    userId,
    entityId: userId,
    data: { invitedById, email, context },
    timestamp: new Date(),
  });
}

export function emitBusinessCreated(
  userId: string,
  businessId: string,
  businessName: string,
  industry: string,
  modes: string[],
  planName: string,
  subscriptionId?: string,
): void {
  firdausEventBus.emit({
    type: "BusinessCreated",
    businessId,
    userId,
    entityId: businessId,
    data: { businessName, industry, modes, planName, subscriptionId },
    timestamp: new Date(),
  });
}

// ─── Handler registration ───────────────────────────────────────────────

export function registerRegistrationEventHandlers(): void {
  // Also activate the dormant commerce handlers
  registerDefaultHandlers();

  firdausEventBus.on("UserRegistered", async (event) => {
    const { invitedById, email, context } = event.data as Record<string, string>;

    try {
      await createNotification({
        userId: invitedById || event.userId,
        title: "User invited",
        message: `You invited ${email} to ${context} team`,
        type: "INFO",
        referenceType: "user",
        referenceId: event.entityId,
      } as any);
    } catch {}

    try {
      await recordActivity({
        userId: invitedById || event.userId,
        action: `user.invited.${context}`,
        resourceType: "user",
        resourceId: event.entityId,
        metadata: { email },
      } as any);
    } catch {}
  });

  firdausEventBus.on("UserAssignedToContext", async (event) => {
    const { invitedById, email, context } = event.data as Record<string, string>;

    try {
      await createNotification({
        userId: invitedById || event.userId,
        title: "User assigned to team",
        message: `Assigned ${email} to ${context} team`,
        type: "INFO",
        referenceType: "user",
        referenceId: event.entityId,
      } as any);
    } catch {}

    try {
      await recordActivity({
        userId: invitedById || event.userId,
        action: `user.assigned.${context}`,
        resourceType: "user",
        resourceId: event.entityId,
        metadata: { email },
      } as any);
    } catch {}
  });

  firdausEventBus.on("BusinessCreated", async (event) => {
    const { businessName, industry, planName } = event.data as Record<string, unknown>;

    try {
      await createNotification({
        userId: event.userId,
        title: "Business created",
        message: `Business "${businessName}" created successfully`,
        type: "INFO",
        referenceType: "business",
        referenceId: event.entityId,
      } as any);
    } catch {}

    try {
      await recordActivity({
        userId: event.userId,
        action: "business.created",
        resourceType: "business",
        resourceId: event.entityId,
        metadata: { businessName, plan: planName, industry },
      } as any);
    } catch {}
  });
}

// Auto-initialize on module load
registerRegistrationEventHandlers();
