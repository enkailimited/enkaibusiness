"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import { RefreshCw, Pencil, Mail, Loader2 } from "lucide-react";

import { getMembersAction, reinviteWorkspaceMemberAction } from "@/features/members/actions";

type MemberUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  inviteStatus: string | null;
  inviteSentAt: string | null;
};

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: MemberUser;
};

const roleColors: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-blue-100 text-blue-700",
  MEMBER: "bg-slate-100 text-slate-700",
  GUEST: "bg-gray-100 text-gray-600",
};

export default function WorkspaceMembersPage() {
  const [data, setData] = useState<{ members: Member[]; workspaceName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reinviteTarget, setReinviteTarget] = useState<Member | null>(null);
  const [reinviteForm, setReinviteForm] = useState({ email: "", phone: "" });
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const load = useCallback(async () => {
    const result = await getMembersAction();
    setData(result as unknown as { members: Member[]; workspaceName: string });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reinviteMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data?: { email?: string; phone?: string } }) => {
      const result = await reinviteWorkspaceMemberAction(memberId, data);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast({ title: "Re-invited", description: result.message });
      setReinviteTarget(null);
      load();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Members"
        description={`${data?.members.length ?? 0} workspace member${(data?.members.length ?? 0) !== 1 ? "s" : ""}`}
      />

      <Card>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 border-b bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <div>Member</div><div>Email</div><div>Role</div><div>Joined</div><div></div>
          </div>
          <div className="divide-y">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))
              : data?.members.map((m) => (
                  <div key={m.id} className="grid grid-cols-1 gap-2 px-4 py-4 hover:bg-muted/20 transition-colors md:grid-cols-[2fr_2fr_1fr_1fr_80px] md:items-center md:gap-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                        {getInitials(m.user.firstName, m.user.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{m.user.firstName} {m.user.lastName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{m.user.email}</p>
                      </div>
                    </div>
                    <p className="hidden text-sm text-muted-foreground md:block truncate">{m.user.email}</p>
                    <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[m.role] ?? "bg-muted text-muted-foreground"}`}>
                      {m.role}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => {
                          setReinviteTarget(m);
                          setReinviteForm({ email: m.user.email, phone: m.user.phone ?? "" });
                        }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Re-invite member"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>

      {/* Re-invite dialog with inline editing */}
      <Dialog open={!!reinviteTarget} onOpenChange={(open) => { if (!open) setReinviteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-invite Member</DialogTitle>
            <DialogDescription>
              {reinviteTarget
                ? `Send a new invitation to ${reinviteTarget.user.firstName} ${reinviteTarget.user.lastName}. Edit email/phone if needed.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!reinviteTarget) return;
              const data: { email?: string; phone?: string } = {};
              if (reinviteForm.email !== reinviteTarget.user.email) data.email = reinviteForm.email;
              if (reinviteForm.phone !== (reinviteTarget.user.phone ?? "")) data.phone = reinviteForm.phone;
              reinviteMutation.mutate({
                memberId: reinviteTarget.id,
                data: Object.keys(data).length > 0 ? data : undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={reinviteForm.email}
                onChange={(e) => setReinviteForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={reinviteForm.phone}
                onChange={(e) => setReinviteForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReinviteTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={reinviteMutation.isPending}>
                <Mail className="mr-2 h-4 w-4" />
                Send Re-invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
