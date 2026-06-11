import type { Lead, LeadActivity, LeadAssignment, SalesProfile, User } from "@/types/models";

export interface LeadWithAssignments extends Lead {
  assignedTo?: (Pick<SalesProfile, "id"> & {
    user: Pick<User, "id" | "firstName" | "lastName" | "email">;
  }) | null;
  _count?: { activities: number; assignments: number };
}

export interface LeadWithActivities extends Lead {
  assignedTo?: (Pick<SalesProfile, "id"> & {
    user: Pick<User, "id" | "firstName" | "lastName" | "email" | "phone" | "avatarUrl">;
    hierarchy?: { id: string; title: string; level: number; slug: string } | null;
  }) | null;
  activities: (LeadActivity & {
    createdBy?: Pick<User, "id" | "firstName" | "lastName" | "email"> | null;
  })[];
  assignments: (LeadAssignment & {
    assignedTo: Pick<SalesProfile, "id"> & {
      user: Pick<User, "id" | "firstName" | "lastName" | "email">;
    };
    assignedBy: Pick<User, "id" | "firstName" | "lastName" | "email">;
  })[];
}

export interface LeadActivityWithUser extends LeadActivity {
  createdBy?: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl"> | null;
}

export interface LeadAssignmentWithProfiles extends LeadAssignment {
  assignedTo: Pick<SalesProfile, "id"> & {
    user: Pick<User, "id" | "firstName" | "lastName" | "email">;
  };
  assignedBy: Pick<User, "id" | "firstName" | "lastName" | "email">;
}

export interface LeadFilters {
  status?: string;
  source?: string;
  assignedToId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface LeadMetrics {
  totalLeads: number;
  totalConverted: number;
  convertedThisMonth: number;
  lostCount: number;
  conversionRate: number;
  statusBreakdown: { status: string; count: number }[];
}
