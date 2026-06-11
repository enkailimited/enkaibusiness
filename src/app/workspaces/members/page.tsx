"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";

import { getMembersAction } from "@/features/members/actions";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean };
};

const roleColors: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700",
  ADMIN: "bg-blue-100 text-blue-700",
  MEMBER: "bg-slate-100 text-slate-700",
  GUEST: "bg-gray-100 text-gray-600",
};

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getMembersAction();
    setMembers(data as unknown as Member[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Members"
        description={`${members.length} workspace member${members.length !== 1 ? "s" : ""}`}
      />

      <Card>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[2fr_2fr_1fr_1fr] gap-4 border-b bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <div>Member</div><div>Email</div><div>Role</div><div>Joined</div>
          </div>
          <div className="divide-y">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))
              : members.map((m) => (
                  <div key={m.id} className="grid grid-cols-1 gap-2 px-4 py-4 hover:bg-muted/20 transition-colors md:grid-cols-[2fr_2fr_1fr_1fr] md:items-center md:gap-4 md:px-6">
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
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
