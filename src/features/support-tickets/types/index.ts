import type { SupportTicket, User } from "@/types/models";

export type { TicketStatus, TicketPriority } from "@prisma/client";

export interface TicketWithRelations extends SupportTicket {
  customer: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl" | "phone">;
  assignedTo: Pick<User, "id" | "firstName" | "lastName" | "email" | "avatarUrl"> | null;
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  customerId: string;
  priority?: string;
  businessId?: string;
}

export interface TicketFilter {
  status?: string;
  priority?: string;
  assignedToId?: string;
  customerId?: string;
  businessId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
