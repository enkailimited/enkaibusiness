import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getCustomerInstallation } from "@/features/installations/services/customer-installation-service";
import { getInstallationProgress } from "@/features/installations/services/installation-service";

export const dynamic = "force-dynamic";

export default async function CustomerInstallationPage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/installations?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const installation = await getCustomerInstallation(business.id);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Installation Status</h1>
        <p className="text-muted-foreground">{business.name}</p>
      </div>

      {!installation ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground text-lg">No installation in progress</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{installation.ticketNumber}</p>
                <p className="text-sm text-muted-foreground capitalize">{installation.type.replace(/_/g, " ")}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                installation.status === "ACTIVATED" ? "bg-green-100 text-green-800" :
                installation.status === "DECLINED" ? "bg-red-100 text-red-800" :
                installation.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {installation.status.replace(/_/g, " ")}
              </span>
            </div>

            {installation.notes && (
              <p className="text-sm text-muted-foreground">{installation.notes}</p>
            )}
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Progress</h2>
            <div className="space-y-2">
              {getInstallationProgress(installation.status).map((step) => (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    step.complete ? "bg-green-500" :
                    step.active ? "bg-primary ring-2 ring-primary/30" :
                    "bg-gray-200"
                  }`} />
                  <span className={`${step.complete ? "text-green-700 font-medium" : step.active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Tasks ({installation.tasks.filter((t) => t.isCompleted).length}/{installation.tasks.length})
            </h2>
            <div className="space-y-2">
              {installation.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                    task.isCompleted ? "bg-green-500 text-white" : "border-2 border-gray-300"
                  }`}>
                    {task.isCompleted && <span className="text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={task.isCompleted ? "line-through text-muted-foreground" : ""}>{task.name}</p>
                    {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {installation.activatedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-lg font-bold text-green-800">✓ Installation Complete</p>
              <p className="text-sm text-green-600">Activated on {new Date(installation.activatedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
