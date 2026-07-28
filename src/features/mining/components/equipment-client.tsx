"use client";

import { useActionState } from "react";
import { createMiningEquipmentAction, createServiceLogAction } from "../actions";

export function MiningEquipmentClient({ businessId, equipment, stats, dueService }: any) {
  const [createState, createAction, createPending] = useActionState(createMiningEquipmentAction.bind(null, businessId), null);
  const [svcState, svcAction, svcPending] = useActionState(createServiceLogAction.bind(null, businessId), null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mining Equipment</h1>
        <p className="text-muted-foreground">Manage machinery and equipment</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Operational</p><p className="text-2xl font-bold text-green-600">{stats.operational}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Maintenance</p><p className="text-2xl font-bold text-amber-500">{stats.maintenance}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Due for Service</p><p className="text-2xl font-bold text-red-500">{dueService.length}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form action={createAction} className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Add Equipment</h3>
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Equipment name *" required className="border rounded px-3 py-2 text-sm" />
            <input name="equipmentType" placeholder="Type (excavator, loader, truck, drill, generator)" className="border rounded px-3 py-2 text-sm" />
            <input name="make" placeholder="Make" className="border rounded px-3 py-2 text-sm" />
            <input name="model" placeholder="Model" className="border rounded px-3 py-2 text-sm" />
            <input name="serialNumber" placeholder="Serial number" className="border rounded px-3 py-2 text-sm" />
            <input name="fuelType" placeholder="Fuel type (DIESEL, PETROL)" className="border rounded px-3 py-2 text-sm" />
            <input name="hourlyFuelUsage" type="number" step="0.1" placeholder="Hourly fuel usage (L)" className="border rounded px-3 py-2 text-sm" />
            <input name="meterReading" type="number" step="0.1" placeholder="Meter reading" className="border rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={createPending} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
            {createPending ? "Saving..." : "Add Equipment"}
          </button>
        </form>

        <form action={svcAction} className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Log Service</h3>
          <div className="space-y-3">
            <select name="equipmentId" required className="border rounded px-3 py-2 text-sm w-full">
              <option value="">Select equipment...</option>
              {equipment.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="serviceType" placeholder="Service type * (routine, repair, inspection)" className="border rounded px-3 py-2 text-sm" />
              <input name="serviceDate" type="date" required className="border rounded px-3 py-2 text-sm" />
              <input name="cost" type="number" step="0.01" placeholder="Cost" className="border rounded px-3 py-2 text-sm" />
              <input name="meterAtService" type="number" step="0.1" placeholder="Meter reading" className="border rounded px-3 py-2 text-sm" />
              <input name="nextServiceDate" type="date" placeholder="Next service date" className="border rounded px-3 py-2 text-sm" />
            </div>
            <textarea name="description" placeholder="Description" className="border rounded px-3 py-2 text-sm w-full" rows={2} />
          </div>
          <button type="submit" disabled={svcPending} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
            {svcPending ? "Saving..." : "Log Service"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">All Equipment ({equipment.length})</h3></div>
        {equipment.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No equipment yet.</p>
        ) : (
          equipment.map((eq: any) => (
            <div key={eq.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{eq.name}</p>
                <p className="text-xs text-muted-foreground">
                  {eq.equipmentType} · {eq.make} {eq.model} · {eq.serialNumber || "N/A"}
                  {eq.site?.name ? ` · Site: ${eq.site.name}` : ""}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${eq.status === "OPERATIONAL" ? "bg-green-100 text-green-700" : eq.status === "MAINTENANCE" ? "bg-amber-100 text-amber-700" : eq.status === "REPAIR" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                {eq.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
