import type { SubscriptionPlan, Subscription, SubscriptionPayment } from "@prisma/client";

export type PlanInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export interface PlanWithRelations extends SubscriptionPlan {
  _count?: { subscriptions: number };
}

export interface SubscriptionWithRelations extends Subscription {
  plan: SubscriptionPlan;
  business: { id: string; name: string; legalName?: string | null };
  payments?: SubscriptionPayment[];
  _count?: { payments: number };
}

export interface SubscriptionListItem {
  id: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  plan: { id: string; name: string; amount: number; interval: string };
  business: { id: string; name: string };
  _count: { payments: number };
}

export interface PaymentWithRelations extends SubscriptionPayment {
  subscription: { id: string; plan: { name: string } };
}

export interface PlanFilter {
  isActive?: boolean;
  interval?: PlanInterval;
}

export interface SubscriptionFilter {
  status?: string;
  businessId?: string;
  planId?: string;
  fromDate?: string;
  toDate?: string;
}
