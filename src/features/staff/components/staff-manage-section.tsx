"use client";

import { useState, useCallback } from "react";
import { StaffList } from "./staff-list";
import { StaffForm } from "./staff-form";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { reinviteUserAction } from "@/features/users/actions";
import type { StaffWithUser, StaffAssignmentWithDetails } from "../types";

interface StaffManageSectionProps {
  businessId: string;
  staff: (StaffWithUser & { assignments?: StaffAssignmentWithDetails[] })[];
}

export function StaffManageSection({ businessId, staff }: StaffManageSectionProps) {
  const [editStaff, setEditStaff] = useState<StaffWithUser | null>(null);
  const [reinviteStaff, setReinviteStaff] = useState<StaffWithUser | null>(null);
  const [reinviteMessage, setReinviteMessage] = useState<string | null>(null);
  const [reinviting, setReinviting] = useState(false);

  const handleEdit = useCallback((staff: StaffWithUser) => {
    setEditStaff(staff);
  }, []);

  const handleReinvite = useCallback((staff: StaffWithUser) => {
    setReinviteStaff(staff);
    setReinviteMessage(null);
  }, []);

  const handleReinviteConfirm = useCallback(async () => {
    if (!reinviteStaff) return;
    setReinviting(true);
    setReinviteMessage(null);
    const result = await reinviteUserAction(reinviteStaff.userId);
    setReinviteMessage(result.message);
    setReinviting(false);
  }, [reinviteStaff]);

  const handleEditSuccess = useCallback(() => {
    setEditStaff(null);
  }, []);

  return (
    <>
      <StaffList
        staff={staff}
        onEdit={handleEdit}
        onReinvite={handleReinvite}
      />

      {editStaff && (
        <Modal open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
          <ModalContent title="Edit Staff" description="Update staff information">
            <StaffForm businessId={businessId} staff={editStaff} onSuccess={handleEditSuccess} />
          </ModalContent>
        </Modal>
      )}

      {reinviteStaff && (
        <Modal open={!!reinviteStaff} onOpenChange={() => { setReinviteStaff(null); setReinviteMessage(null); }}>
          <ModalContent title="Re-invite Staff" description={`Send a new invitation to ${reinviteStaff.user.firstName} ${reinviteStaff.user.lastName}`}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will generate a new temporary password and send a re-invitation email to <strong>{reinviteStaff.user.email}</strong>.
              </p>
              {reinviteMessage && (
                <div className={`rounded-xl p-4 text-sm ${reinviteMessage.includes("successfully") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  <p className="font-medium">{reinviteMessage}</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setReinviteStaff(null); setReinviteMessage(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleReinviteConfirm} disabled={reinviting}>
                  {reinviting ? "Sending..." : "Send Re-invitation"}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
