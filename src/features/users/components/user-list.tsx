"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck, ShieldX, Trash2, RefreshCw, Pencil, Mail } from "lucide-react";
import type { UserProfile } from "@/features/users/types";
import {
  listUsersAction,
  activateUserAction,
  deactivateUserAction,
  deleteUserAction,
  reinviteUserAction,
  updateUserAction,
} from "@/features/users/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";

export function UserList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserProfile | null>(null);
  const [reinviteTarget, setReinviteTarget] = useState<UserProfile | null>(null);
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["users", { search, page }],
    queryFn: async () => {
      const result = await listUsersAction({ search: search || undefined, page });
      if (!result.success) {
        throw new Error(result.message);
      }
      return { users: result.users ?? [], total: result.total ?? 0 };
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await activateUserAction(userId);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setToggleTarget(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deactivateUserAction(userId);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setToggleTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUserAction(userId);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
  });

  const [reinviteForm, setReinviteForm] = useState({ email: "", phone: "" });

  const reinviteMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data?: { email?: string; phone?: string } }) => {
      const result = await reinviteUserAction(userId, data);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast({ title: "Re-invited", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setReinviteTarget(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { firstName?: string; lastName?: string; email?: string; phone?: string } }) => {
      const result = await updateUserAction(userId, data);
      if (!result.success) throw new Error(result.message);
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "User info updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditTarget(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage platform users</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {query.isPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">
              {query.error?.message ?? "Failed to load users"}
            </p>
          ) : query.data.users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found
            </p>
          ) : (
            <ul className="space-y-3">
              {query.data.users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar>
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {user.inviteStatus === "PENDING" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-600">
                          Invited
                        </Badge>
                      )}
                      {user.inviteStatus === "ACCEPTED" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-600">
                          Joined
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    {user.roles && user.roles.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="outline" className="text-[10px] px-1.5 py-0">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {user.isActive && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit user info"
                          onClick={() => {
                            setEditTarget(user);
                            setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? "" });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Re-invite user"
                          onClick={() => {
                            setReinviteTarget(user);
                            setReinviteForm({ email: user.email, phone: user.phone ?? "" });
                          }}
                          disabled={reinviteMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {user.isActive ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600"
                        title="Deactivate user"
                        onClick={() => setToggleTarget(user)}
                        disabled={deactivateMutation.isPending}
                      >
                        <ShieldX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600"
                        title="Activate user"
                        onClick={() => setToggleTarget(user)}
                        disabled={activateMutation.isPending}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      title="Delete user"
                      onClick={() => setDeleteTarget(user)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {query.data && query.data.total > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {query.data.users.length} of {query.data.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={query.data.users.length < 20}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Re-invite dialog with inline editing */}
      <Dialog open={!!reinviteTarget} onOpenChange={(open) => { if (!open) setReinviteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-invite User</DialogTitle>
            <DialogDescription>
              {reinviteTarget
                ? `Send a new invitation to ${reinviteTarget.firstName} ${reinviteTarget.lastName}. Edit email/phone if needed.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!reinviteTarget) return;
              const data: { email?: string; phone?: string } = {};
              if (reinviteForm.email !== reinviteTarget.email) data.email = reinviteForm.email;
              if (reinviteForm.phone !== (reinviteTarget.phone ?? "")) data.phone = reinviteForm.phone;
              reinviteMutation.mutate({
                userId: reinviteTarget.id,
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

      {/* Edit info dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Info</DialogTitle>
            <DialogDescription>Update user's name, email, or phone</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTarget) return;
              updateMutation.mutate({ userId: editTarget.id, data: editForm });
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete User"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.firstName} ${deleteTarget.lastName}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />

      {/* Toggle active status confirmation */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null); }}
        title={toggleTarget?.isActive ? "Deactivate User" : "Activate User"}
        description={
          toggleTarget
            ? toggleTarget.isActive
              ? `${toggleTarget.firstName} ${toggleTarget.lastName} will not be able to log in or access the system.`
              : `Allow ${toggleTarget.firstName} ${toggleTarget.lastName} to log in and access the system again.`
            : ""
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        variant={toggleTarget?.isActive ? "destructive" : "default"}
        onConfirm={() =>
          toggleTarget &&
          (toggleTarget.isActive
            ? deactivateMutation.mutate(toggleTarget.id)
            : activateMutation.mutate(toggleTarget.id))
        }
        loading={deactivateMutation.isPending || activateMutation.isPending}
      />
    </>
  );
}
