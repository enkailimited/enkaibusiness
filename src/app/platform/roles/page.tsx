import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlatformRolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Manage platform and business roles"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Platform Roles
              <Badge variant="secondary">System</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage platform-level roles for internal teams including Super Admin,
              National Manager, Sales Manager, Support, and Finance roles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              Business Roles
              <Badge variant="secondary">Per Business</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage business-level roles including Owner, Manager, Cashier,
              Accountant, Doctor, Pharmacist, and Chef.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
