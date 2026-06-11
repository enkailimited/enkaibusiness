import { requireAuth } from "@/server/auth";
import { getLead } from "../services/lead-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "../constants";

interface LeadDetailProps {
  leadId: string;
}

export async function LeadDetail({ leadId }: LeadDetailProps) {
  await requireAuth();
  const lead = await getLead(leadId);

  if (!lead) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Lead not found</CardContent>
      </Card>
    );
  }

  const statusVariant = lead.status === "CONVERTED" ? "default" : lead.status === "LOST" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {lead.firstName} {lead.lastName}
            <Badge variant={statusVariant}>{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span> {lead.email ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span> {lead.phone ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Business:</span> {lead.businessName ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Source:</span> {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
          </div>
          <div>
            <span className="text-muted-foreground">Assigned To:</span>{" "}
            {lead.assignedTo
              ? `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}`
              : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            {new Date(lead.createdAt).toLocaleDateString()}
          </div>
          {lead.convertedAt && (
            <div>
              <span className="text-muted-foreground">Converted:</span>{" "}
              {new Date(lead.convertedAt).toLocaleDateString()}
            </div>
          )}
          {lead.notes && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1">{lead.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activities recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-l-2 border-muted pl-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    {activity.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.detail}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.createdBy
                        ? `${activity.createdBy.firstName} ${activity.createdBy.lastName} — `
                        : ""}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment History</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {lead.assignments.map((assignment) => (
                <div key={assignment.id} className="text-sm border-b pb-2 last:border-0">
                  <span className="font-medium">
                    {assignment.assignedTo.user.firstName} {assignment.assignedTo.user.lastName}
                  </span>
                  {" — assigned by "}
                  <span className="text-muted-foreground">
                    {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
                  </span>
                  {assignment.reason && <p className="text-xs text-muted-foreground mt-0.5">{assignment.reason}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(assignment.assignedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
