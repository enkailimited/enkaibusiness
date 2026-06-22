"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  User,
  History,
  MessageSquare,
  Calendar,
  ChevronRight,
  Activity,
  UserPlus,
  Send,
} from "lucide-react";
import {
  getLeadAction,
  updateLeadStatusAction,
  assignLeadAction,
  addLeadActivityAction,
  resendLeadCredentialsAction,
} from "@/server/actions/leads";
import { formatDate, getInitials, formatRelativeTime } from "@/lib/utils";

interface LeadDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  source: string;
  status: string;
  notes: string | null;
  assignedToId: string | null;
  convertedAt: string | null;
  createdAt: string;
  assignedTo: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
    };
    hierarchy: { title: string } | null;
  } | null;
  activities: {
    id: string;
    action: string;
    detail: string | null;
    createdAt: string;
    createdBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }[];
  assignments: {
    id: string;
    assignedTo: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    assignedBy: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    reason: string | null;
    assignedAt: string;
  }[];
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  NEW: "default",
  CONTACTED: "secondary",
  INTERESTED: "warning",
  DEMO: "warning",
  NEGOTIATION: "warning",
  CONVERTED: "success",
  LOST: "destructive",
};

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [assignInput, setAssignInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const data = await getLeadAction(params.id as string);
      setLead(data as unknown as LeadDetail);
    } catch (error) {
      console.error("Failed to load lead:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    try {
      await updateLeadStatusAction(lead.id, status);
      setShowStatusMenu(false);
      await loadLead();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAssign = async () => {
    if (!lead || !assignInput.trim()) return;
    try {
      const formData = new FormData();
      formData.set("leadId", lead.id);
      formData.set("assignedToId", assignInput);
      formData.set("reason", "Manual assignment");
      await assignLeadAction(null, formData);
      setShowAssignForm(false);
      setAssignInput("");
      await loadLead();
    } catch (error) {
      console.error("Failed to assign lead:", error);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !noteInput.trim()) return;
    try {
      const formData = new FormData();
      formData.set("leadId", lead.id);
      formData.set("action", "NOTE");
      formData.set("detail", noteInput);
      await addLeadActivityAction(null, formData);
      setShowNoteForm(false);
      setNoteInput("");
      await loadLead();
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const handleResendCredentials = async () => {
    if (!lead) return;
    setResendLoading(true);
    setResendResult(null);
    try {
      const result = await resendLeadCredentialsAction(lead.id, resendEmail || undefined);
      setResendResult(result.message);
      if (result.success) {
        await loadLead();
      }
    } catch (error) {
      setResendResult("Failed to resend credentials");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead Not Found" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <User className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              This lead does not exist or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/platform/leads")}
            >
              Back to Leads
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={lead.businessName || "Lead detail"}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/platform/leads")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <Badge
                        variant={STATUS_VARIANTS[lead.status] || "outline"}
                      >
                        {lead.status}
                      </Badge>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border bg-background shadow-lg">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent"
                          >
                            <Badge
                              variant={STATUS_VARIANTS[status] || "outline"}
                              className="mr-2"
                            >
                              {status}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Source</div>
                  <div className="text-sm font-medium">{lead.source}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {lead.businessName || "No business"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created {formatDate(lead.createdAt)}
                  </span>
                </div>
              </div>
              {lead.notes && (
                <div className="mt-4 rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="mt-1 text-sm">{lead.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {lead.activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        {index < lead.activities.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {activity.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                        {activity.detail && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {activity.detail}
                          </p>
                        )}
                        {activity.createdBy && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            by {activity.createdBy.firstName}{" "}
                            {activity.createdBy.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No assignment history.
                </p>
              ) : (
                <div className="space-y-3">
                  {lead.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <UserPlus className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm">
                          Assigned to{" "}
                          <span className="font-medium">
                            {assignment.assignedTo.user.firstName}{" "}
                            {assignment.assignedTo.user.lastName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          by {assignment.assignedBy.firstName}{" "}
                          {assignment.assignedBy.lastName} &middot;{" "}
                          {formatRelativeTime(assignment.assignedAt)}
                        </div>
                        {assignment.reason && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Reason: {assignment.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                <History className="mr-2 h-4 w-4" />
                Change Status
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowAssignForm(!showAssignForm)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Lead
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowNoteForm(!showNoteForm)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Note
              </Button>
              {lead.status === "CONVERTED" && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setShowResendForm(!showResendForm);
                    setResendEmail(lead.email || "");
                    setResendResult(null);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Resend Credentials
                </Button>
              )}
            </CardContent>
          </Card>

          {showResendForm && lead.status === "CONVERTED" && (
            <Card>
              <CardHeader>
                <CardTitle>Resend Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResendCredentials}
                    disabled={resendLoading || !resendEmail.trim()}
                    size="sm"
                  >
                    {resendLoading ? "Sending..." : "Send"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResendForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                {resendResult && (
                  <p className={`text-sm ${resendResult.includes("successfully") ? "text-emerald-600" : "text-red-600"}`}>
                    {resendResult}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {lead.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(
                      lead.assignedTo.user.firstName,
                      lead.assignedTo.user.lastName,
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {lead.assignedTo.user.firstName}{" "}
                      {lead.assignedTo.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lead.assignedTo.hierarchy?.title || "Sales"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showAssignForm && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Sales Profile ID..."
                  value={assignInput}
                  onChange={(e) => setAssignInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAssign} size="sm">
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showNoteForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Enter note..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNoteForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
