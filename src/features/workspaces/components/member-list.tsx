import { requireAuth } from "@/server/auth";
import { getWorkspaceMembers } from "../services/workspace-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { WORKSPACE_MEMBER_ROLE_LABELS, WORKSPACE_MEMBER_ROLE_COLORS } from "../constants";

interface MemberListProps {
  workspaceId: string;
}

export async function MemberList({ workspaceId }: MemberListProps) {
  await requireAuth();
  const members = await getWorkspaceMembers(workspaceId);

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar>
            <AvatarImage src={member.user.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(member.user.firstName, member.user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {member.user.firstName} {member.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={WORKSPACE_MEMBER_ROLE_COLORS[member.role] as any}>
              {WORKSPACE_MEMBER_ROLE_LABELS[member.role]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(member.joinedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
