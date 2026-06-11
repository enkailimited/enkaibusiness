import { z } from "zod";

export const ticketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const ticketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title is too long"),
  description: z.string().optional().or(z.literal("")),
  customerId: z.string().uuid("Invalid customer ID"),
  priority: ticketPriorityEnum.default("MEDIUM"),
  businessId: z.string().uuid().optional(),
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title is too long")
    .optional(),
  description: z.string().optional().or(z.literal("")),
  priority: ticketPriorityEnum.optional(),
});

export const assignTicketSchema = z.object({
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const ticketFilterSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTicketSchema = z.infer<typeof createTicketSchema>;
export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>;
export type AssignTicketSchema = z.infer<typeof assignTicketSchema>;
export type TicketFilterSchema = z.infer<typeof ticketFilterSchema>;
