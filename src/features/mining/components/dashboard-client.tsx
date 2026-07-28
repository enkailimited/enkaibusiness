"use client";

import type { MiningDashboard } from "../services/dashboard-service";

interface Props {
  businessId: string;
  businessName: string;
  dashboard: MiningDashboard;
}

export function MiningDashboardClient({ businessId, businessName, dashboard }: Props) {
  const { sites, production, fuel, equipment, licenses, productionChart, monthlySales, dueForService, alerts } = dashboard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{businessName}</h1>
        <p className="text-muted-foreground">Mining Dashboard</p>
      </div>

      {/* Production KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Today&apos;s Production</p>
          <p className="text-2xl font-bold">{production.today.toLocaleString()} t</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Monthly Production</p>
          <p className="text-2xl font-bold">{production.thisMonth.toLocaleString()} t</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Monthly Sales</p>
          <p className="text-2xl font-bold">{monthlySales.toLocaleString()} TZS</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Active Sites</p>
          <p className="text-2xl font-bold">{sites.active}</p>
        </div>
      </div>

      {/* Fuel KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Fuel Used (30d)</p>
          <p className="text-2xl font-bold">{fuel.totalLiters.toLocaleString()} L</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Fuel Cost (30d)</p>
          <p className="text-2xl font-bold">{fuel.totalCost.toLocaleString()} TZS</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Equipment Operational</p>
          <p className="text-2xl font-bold">{equipment.operational}/{equipment.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Due for Service</p>
          <p className="text-2xl font-bold text-amber-500">{dueForService}</p>
        </div>
      </div>

      {/* Licenses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Active Licenses</p>
          <p className="text-2xl font-bold text-green-600">{licenses.active}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Expiring Soon</p>
          <p className="text-2xl font-bold text-red-500">{alerts.expiringLicenses}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Licenses</p>
          <p className="text-2xl font-bold">{licenses.total}</p>
        </div>
      </div>

      {/* Fuel by Type */}
      <div>
        <h3 className="font-semibold mb-2">Fuel Consumption by Type (30d)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fuel.byType.map((t) => (
            <div key={t.fuelType} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{t.fuelType}</p>
              <p className="text-lg font-bold">{t.quantity.toLocaleString()} L</p>
              <p className="text-xs text-muted-foreground">{t.cost.toLocaleString()} TZS</p>
            </div>
          ))}
          {fuel.byType.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">No fuel transactions this month</p>
          )}
        </div>
      </div>

      {/* Production Chart Data */}
      <div>
        <h3 className="font-semibold mb-2">Production (Last 30 Days)</h3>
        <div className="rounded-lg border p-4">
          {productionChart.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {productionChart.map((d) => {
                const max = Math.max(...productionChart.map((x) => x.quantity), 1);
                const height = (d.quantity / max) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary/80 rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${d.date}: ${d.quantity}t`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No production data</p>
          )}
        </div>
      </div>
    </div>
  );
}
