"use client";

import { useState } from "react";
import { Modal, ModalTrigger, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { UserInviteForm } from "@/features/users/components/user-invite-form";

interface StaffRegisterDialogProps {
  businessId?: string;
}

export function StaffRegisterDialog({ businessId }: StaffRegisterDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button size="sm" variant="outline">
          Register Staff
        </Button>
      </ModalTrigger>
      <ModalContent
        title="Invite User"
        description="Create a user and send an invitation email"
      >
        <UserInviteForm businessId={businessId} />
      </ModalContent>
    </Modal>
  );
}
