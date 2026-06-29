"use client";

import { useCallback } from "react";
import { inviteSalesTeamMemberAction } from "@/features/sales-network/actions/invite-team-action";
import { InviteForm } from "@/components/registrations/invite-form";
import type { ActionResponse } from "@/types/relationships";

interface HierarchyOption {
  id: string;
  title: string;
  slug: string;
}

interface InviteTeamMemberFormProps {
  hierarchies: HierarchyOption[];
  onSuccess?: () => void;
}

export function InviteTeamMemberForm({ hierarchies, onSuccess }: InviteTeamMemberFormProps) {
  const wrappedAction = useCallback(
    async (_prev: ActionResponse | null, formData: FormData) => {
      const result = await inviteSalesTeamMemberAction(_prev, formData);
      return result as ActionResponse;
    },
    [],
  );

  return (
    <InviteForm
      context="sales_team"
      action={wrappedAction}
      hierarchyOptions={hierarchies}
      onSuccess={onSuccess}
      title="Add Team Member"
      description="Create a user, assign a sales role, and send an invitation"
    />
  );
}
