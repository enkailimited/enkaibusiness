"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformRolesAction, getBusinessRolesAction } from "@/features/roles/actions";
import { inviteUserWithStaffAction } from "@/features/users/actions";
import { InviteForm } from "@/components/registrations/invite-form";
import type { ActionResponse } from "@/types/relationships";

interface UserInviteFormProps {
  businessId?: string;
}

export function UserInviteForm({ businessId }: UserInviteFormProps) {
  const [roles, setRoles] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = businessId ? getBusinessRolesAction() : getPlatformRolesAction();
    fetchRoles
      .then((data) => setRoles(data as { id: string; name: string; slug: string }[]))
      .finally(() => setRolesLoading(false));
  }, [businessId]);

  const wrappedAction = useCallback(
    async (prev: ActionResponse | null, formData: FormData) => {
      if (businessId) formData.set("businessId", businessId);
      return inviteUserWithStaffAction(prev, formData);
    },
    [businessId],
  );

  return (
    <InviteForm
      context={businessId ? "business" : "platform"}
      action={wrappedAction}
      businessId={businessId}
      roles={roles}
      rolesLoading={rolesLoading}
    />
  );
}
