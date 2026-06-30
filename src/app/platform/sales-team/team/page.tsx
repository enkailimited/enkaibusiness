"use client";

import { useEffect, useState, useCallback, useActionState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, ChevronDown, ChevronRight, RefreshCw, Pencil, Loader2 } from "lucide-react";
import { getMyTeamAction, getAddableHierarchiesAction } from "@/features/sales-network/actions/team-actions";
import { reinviteTeamMemberAction, updateTeamMemberAction } from "@/features/sales-network/actions/invite-team-action";
import { InviteTeamMemberForm } from "@/features/sales-network/components/invite-team-member-form";

interface TeamMember {
  id: string;
  userId: string;
  status: string;
  inviteStatus: string | null;
  inviteSentAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  hierarchy: {
    id: string;
    title: string;
    slug: string;
    level: number;
  } | null;
  _count: {
    subordinates: number;
    leads: number;
  };
  subordinates: TeamMember[];
}

interface MyTeamData {
  profile: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    hierarchy: { title: string; slug: string } | null;
  };
  tree: TeamMember[];
}

function TreeNode({ member, depth, onRefresh }: { member: TeamMember; depth: number; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = member.subordinates && member.subordinates.length > 0;
  const [reinviteOpen, setReinviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [reinviteState, reinviteAction, reinvitePending] = useActionState(reinviteTeamMemberAction, null);
  const [editState, editAction, editPending] = useActionState(updateTeamMemberAction, null);

  useEffect(() => {
    if (reinviteState?.success) {
      setReinviteOpen(false);
      onRefresh();
    }
  }, [reinviteState, onRefresh]);

  useEffect(() => {
    if (editState?.success) {
      setEditOpen(false);
      onRefresh();
    }
  }, [editState, onRefresh]);

  const statusVariant =
    member.status === "ACTIVE" ? "default"
    : member.status === "INACTIVE" ? "secondary"
    : "destructive";

  const needsInvite = member.inviteStatus === "PENDING" || member.inviteStatus === null;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors flex-wrap"
        style={{ marginLeft: depth * 24 }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}
        <div className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
        <span className="font-medium text-sm truncate">
          {member.user.firstName} {member.user.lastName}
        </span>
        {member.hierarchy && (
          <Badge variant="outline" className="text-xs shrink-0">{member.hierarchy.title}</Badge>
        )}
        <Badge variant={statusVariant} className="text-xs shrink-0">
          {member.status}
        </Badge>
        {needsInvite && (
          <Badge variant="secondary" className="text-xs shrink-0">Invited</Badge>
        )}
        <span className="text-xs text-muted-foreground shrink-0">
          {member._count.leads} leads
        </span>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            onClick={() => setEditOpen(true)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit info"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {needsInvite && (
            <button
              onClick={() => setReinviteOpen(true)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Resend invite"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Re-invite dialog */}
      <Dialog open={reinviteOpen} onOpenChange={setReinviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Invite</DialogTitle>
            <DialogDescription>Send a new invitation to {member.user.firstName} {member.user.lastName}</DialogDescription>
          </DialogHeader>
          <form action={reinviteAction} className="space-y-4">
            <input type="hidden" name="userId" value={member.userId} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" defaultValue={member.user.email} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" />
            </div>
            {reinviteState?.message && (
              <p className={`text-sm ${reinviteState.success ? "text-green-600" : "text-destructive"}`}>
                {reinviteState.message}
              </p>
            )}
            <Button type="submit" disabled={reinvitePending} className="w-full">
              {reinvitePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Re-invitation
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit info dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update info for {member.user.firstName} {member.user.lastName}</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="userId" value={member.userId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">First name</label>
                <Input name="firstName" defaultValue={member.user.firstName} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last name</label>
                <Input name="lastName" defaultValue={member.user.lastName} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" defaultValue={member.user.email} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" />
            </div>
            {editState?.message && (
              <p className={`text-sm ${editState.success ? "text-green-600" : "text-destructive"}`}>
                {editState.message}
              </p>
            )}
            <Button type="submit" disabled={editPending} className="w-full">
              {editPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {expanded && hasChildren && (
        <div className="border-l-2 border-muted ml-6">
          {member.subordinates.map((child) => (
            <TreeNode key={child.id} member={child} depth={depth + 1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [hierarchies, setHierarchies] = useState<{ id: string; title: string; slug: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMyTeamAction();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getAddableHierarchiesAction().then(setHierarchies);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Team" description="Manage your sales team" />
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Team" description="Manage your sales team" />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3 text-muted-foreground/40" />
            <p>You don&apos;t have a sales team role assigned.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Team"
        description={`${data.profile.hierarchy?.title || "Team"} — ${data.profile.user.firstName} ${data.profile.user.lastName}`}
      >
        {hierarchies.length > 0 && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="sr-only">Add Team Member</DialogTitle>
                <DialogDescription className="sr-only">Multi-step form to invite a new team member</DialogDescription>
              </DialogHeader>
              <InviteTeamMemberForm
                hierarchies={hierarchies}
                onSuccess={() => {
                  setAddDialogOpen(false);
                  fetchData();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {data.profile.user.firstName} {data.profile.user.lastName}
            {data.profile.hierarchy && (
              <Badge variant="secondary">{data.profile.hierarchy.title}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.tree.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 text-muted-foreground/40" />
              <p className="text-sm">No team members yet</p>
              {hierarchies.length > 0 && (
                <p className="text-xs mt-1">Click &quot;Add Member&quot; to build your team</p>
              )}
            </div>
          ) : (
            <div className="border-l-2 border-muted ml-2">
              {data.tree.map((member) => (
                <TreeNode key={member.id} member={member} depth={0} onRefresh={fetchData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
