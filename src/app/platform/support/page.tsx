"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getTicketsAction,
  getTicketMetricsAction,
  createTicketAction,
  updateTicketStatusAction,
  assignTicketAction,
} from "@/server/actions/support";
import {
  Ticket,
  TicketCheck,
  Timer,
  CircleX,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Tab = "overview" | "tickets";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface SupportTicket {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  description: string | null;
  customerId: string;
  assignedToId: string | null;
  businessId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: TicketCustomer;
  assignedTo: TicketCustomer | null;
}

interface TicketMetrics {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

const priorityBadgeVariant: Record<TicketPriority, "default" | "warning" | "destructive"> = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "destructive",
  URGENT: "destructive",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tickets", label: "Tickets" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getUserName(user: { firstName: string; lastName: string } | null) {
  if (!user) return "Unassigned";
  return `${user.firstName} ${user.lastName}`;
}

export default function PlatformSupportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCustomerId, setCreateCustomerId] = useState("");
  const [createPriority, setCreatePriority] = useState("MEDIUM");
  const [changingStatus, setChangingStatus] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const data = await getTicketMetricsAction();
      setMetrics(data);
    } catch {
      console.error("Failed to load metrics");
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await getTicketsAction();
      setTickets(data as unknown as SupportTicket[]);
    } catch {
      console.error("Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadTickets();
  }, [loadMetrics, loadTickets]);

  async function handleCreateTicket(formData: FormData) {
    setCreating(true);
    try {
      const result = await createTicketAction(null, formData);
      if (result.success) {
        setCreateOpen(false);
        setCreateTitle("");
        setCreateDescription("");
        setCreateCustomerId("");
        setCreatePriority("MEDIUM");
        loadTickets();
        loadMetrics();
      } else {
        toast({ title: "Error", description: result.message || "Failed to create ticket", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(ticketId: string, status: string) {
    setChangingStatus((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await updateTicketStatusAction(ticketId, status);
      loadTickets();
      loadMetrics();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setChangingStatus((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  async function handleAssign(ticketId: string, formData: FormData) {
    const userId = formData.get("userId") as string;
    if (!userId) return;
    setAssigning((prev) => ({ ...prev, [ticketId]: true }));
    try {
      await assignTicketAction(ticketId, userId);
      loadTickets();
    } catch {
      toast({ title: "Error", description: "Failed to assign ticket", variant: "destructive" });
    } finally {
      setAssigning((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  const totalTickets = metrics
    ? metrics.open + metrics.inProgress + metrics.resolved + metrics.closed
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Customer support ticket management">
        <Button variant="outline" size="sm" onClick={() => { loadMetrics(); loadTickets(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.open ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.inProgress ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <TicketCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{metrics?.resolved ?? 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CircleX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalTickets}</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription className="sr-only">Create a new support ticket</DialogDescription>
                </DialogHeader>
                <form action={handleCreateTicket}>
                  <input type="hidden" name="priority" value={createPriority} />
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        name="title"
                        placeholder="Ticket title"
                        required
                        value={createTitle}
                        onChange={(e) => setCreateTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        name="description"
                        placeholder="Ticket description"
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer ID</label>
                      <Input
                        name="customerId"
                        placeholder="Customer user ID"
                        required
                        value={createCustomerId}
                        onChange={(e) => setCreateCustomerId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={createPriority}
                        onChange={(e) => setCreatePriority(e.target.value)}
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" size="sm">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" size="sm" disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No support tickets"
              description="Create a ticket to get started"
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 rounded-lg bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
                  <div>Title</div>
                  <div>Status</div>
                  <div>Priority</div>
                  <div>Customer</div>
                  <div>Assigned To</div>
                  <div>Created</div>
                </div>
                <div className="divide-y">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 text-sm items-center"
                    >
                      <div className="font-medium truncate">{ticket.title}</div>
                      <div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = new FormData(e.currentTarget);
                            handleStatusChange(ticket.id, form.get("status") as string);
                          }}
                          className="flex items-center gap-1"
                        >
                          <select
                            name="status"
                            defaultValue={ticket.status}
                            onChange={(e) => {
                              handleStatusChange(ticket.id, e.target.value);
                            }}
                            disabled={changingStatus[ticket.id]}
                            className="h-7 rounded border border-input bg-transparent px-1 text-xs"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </form>
                      </div>
                      <div>
                        <Badge variant={priorityBadgeVariant[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="truncate">
                        {getUserName(ticket.customer)}
                      </div>
                      <div className="truncate">
                        {ticket.assignedTo ? (
                          <span>{getUserName(ticket.assignedTo)}</span>
                        ) : (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAssign(ticket.id, new FormData(e.currentTarget));
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              name="userId"
                              placeholder="User ID"
                              className="h-7 w-20 rounded border border-input bg-transparent px-1 text-xs"
                              disabled={assigning[ticket.id]}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-1"
                              disabled={assigning[ticket.id]}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </form>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];
