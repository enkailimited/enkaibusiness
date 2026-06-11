import { PageHeader } from "@/components/layout/page-header";
import { UserList } from "@/features/users/components/user-list";
import { StaffRegisterDialog } from "@/features/staff/components/staff-register-dialog";

export default function PlatformUsersPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Users"
        description="Manage all platform users"
      >
        <StaffRegisterDialog />
      </PageHeader>
      <UserList />
    </div>
  );
}
