export type {
  TicketWithRelations,
  CreateTicketInput,
  TicketFilter,
} from "./types";
export type { TicketStatus, TicketPriority } from "./types";

export {
  TICKET_STATUSES,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  PRIORITY_LABELS,
  DEFAULT_PAGE_SIZE,
} from "./constants";

export {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  ticketFilterSchema,
  ticketPriorityEnum,
  ticketStatusEnum,
} from "./schemas";
export type {
  CreateTicketSchema,
  UpdateTicketSchema,
  AssignTicketSchema,
  TicketFilterSchema,
} from "./schemas";

export {
  createTicket,
  getTicket,
  listTickets,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  getTicketMetrics,
} from "./services/ticket-service";

export {
  createTicketAction,
  getTicketAction,
  listTicketsAction,
  updateTicketAction,
  updateTicketStatusAction,
  assignTicketAction,
  resolveTicketAction,
  closeTicketAction,
  reopenTicketAction,
  deleteTicketAction,
  getTicketMetricsAction,
} from "./actions";

export { TicketList } from "./components/ticket-list";
export { TicketForm } from "./components/ticket-form";
export { TicketDetail } from "./components/ticket-detail";
