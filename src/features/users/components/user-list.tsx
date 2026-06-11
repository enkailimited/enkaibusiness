"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import type { UserProfile } from "@/features/users/types";
import {
  listUsersAction,
  activateUserAction,
  deactivateUserAction,
  deleteUserAction,
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
import { getInitials } from "@/lib/utils";

export function UserList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

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
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
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
