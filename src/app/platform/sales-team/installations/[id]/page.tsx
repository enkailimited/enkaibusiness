import { notFound } from "next/navigation";
import Link from "next/link";
import { getInstallationTicketById } from "@/features/installations/services/installation-service";
import { PageHeader } from "@/components/layout/page-header";
import { TicketStatusBadge } from "@/features/installations/components/ticket-status-badge";
import { ProgressSteps } from "@/features/installations/components/progress-steps";
import { TaskList } from "@/features/installations/components/task-list";
import { TicketActions } from "@/features/installations/components/ticket-actions";

export const dynamic = "force-dynamic";

export default async function InstallationDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ticket = await getInstallationTicketById(id);
  if (!ticket) return notFound();

  return (
    <div className="space-y-6 pb-10">
      <Link href="/platform/sales-team/installations" className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to installations
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <PageHeader title={ticket.ticketNumber} description={ticket.business.name} />
          <div className="flex gap-2 mt-1">
            <TicketStatusBadge status={ticket.status} />
            <span className="text-xs text-muted-foreground">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <TicketActions
          ticketId={ticket.id}
          currentStatus={ticket.status}
          ownerApproved={ticket.ownerApproved}
        />
      </div>

      {ticket.notes && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <p className="text-sm font-medium mb-1">Notes</p>
          <p className="text-sm text-muted-foreground">{ticket.notes}</p>
        </div>
      )}

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4">Progress</h2>
        <ProgressSteps currentStatus={ticket.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{ticket.type.replace(/_/g, " ")}</dd>
            </div>
            {ticket.branch && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Branch</dt>
                <dd className="font-medium">{ticket.branch.name}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tasks</dt>
              <dd className="font-medium">{ticket.tasks.filter((t) => t.isCompleted).length}/{ticket.tasks.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Photos</dt>
              <dd className="font-medium">{ticket.photos.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Training Records</dt>
              <dd className="font-medium">{ticket.trainingRecords.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Verifications</dt>
              <dd className="font-medium">{ticket.verifications.length}</dd>
            </div>
            {ticket.activatedAt && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Activated</dt>
                <dd className="font-medium">{new Date(ticket.activatedAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {ticket.distributor && (
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-4">Distributor</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{ticket.distributor.firstName} {ticket.distributor.lastName}</dd>
              </div>
              {ticket.distributor.email && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{ticket.distributor.email}</dd>
                </div>
              )}
              {ticket.distributor.phone && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{ticket.distributor.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      <TaskList tasks={ticket.tasks} ticketId={ticket.id} />

      {ticket.trainingRecords.length > 0 && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Training Records</h2>
          <div className="space-y-2">
            {ticket.trainingRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{record.topic}</p>
                  {record.description && <p className="text-xs text-muted-foreground">{record.description}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${record.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {record.isCompleted ? "Completed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket.verifications.length > 0 && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Verifications</h2>
          <div className="space-y-2">
            {ticket.verifications.map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{v.type.replace(/_/g, " ")}</p>
                  {v.notes && <p className="text-xs text-muted-foreground">{v.notes}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${v.isApproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {v.isApproved ? "Approved" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
