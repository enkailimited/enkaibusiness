import Link from "next/link";
import { Plus } from "lucide-react";
import { getInstallationTickets } from "@/features/installations/services/installation-service";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function InstallationsPage() {
  const tickets = await getInstallationTickets();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Installations" description="Manage installation tickets for businesses" />
        <Link
          href="/platform/sales-team/installations/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <p className="text-muted-foreground text-lg">No installation tickets yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a new ticket to start the installation process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/platform/sales-team/installations/${ticket.id}`}
              className="block border rounded-lg p-4 hover:border-primary transition-colors bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{ticket.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground">{ticket.business.name}</p>
                  {ticket.branch && (
                    <p className="text-xs text-muted-foreground">Branch: {ticket.branch.name}</p>
                  )}
                  {ticket.distributor && (
                    <p className="text-xs text-muted-foreground">
                      Assigned: {ticket.distributor.firstName} {ticket.distributor.lastName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                    ticket.status === "ACTIVATED" ? "bg-green-100 text-green-800" :
                    ticket.status === "DECLINED" ? "bg-red-100 text-red-800" :
                    ticket.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {ticket.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>{ticket._count.tasks} tasks</span>
                <span>{ticket._count.photos} photos</span>
                <span>{ticket._count.trainingRecords} trainings</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
