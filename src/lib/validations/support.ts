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

export const updateTicketStatusSchema = z.object({
  status: ticketStatusEnum,
});

export type CreateTicketSchema = z.infer<typeof createTicketSchema>;
export type UpdateTicketSchema = z.infer<typeof updateTicketSchema>;
export type UpdateTicketStatusSchema = z.infer<typeof updateTicketStatusSchema>;
