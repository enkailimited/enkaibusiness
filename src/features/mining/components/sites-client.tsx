"use client";

import { useActionState } from "react";
import { createMiningSiteAction, deleteMiningSiteAction } from "../actions";

interface Props {
  businessId: string;
  sites: any[];
  stats: any;
}

export function MiningSitesClient({ businessId, sites, stats }: Props) {
  const [createState, createAction, createPending] = useActionState(createMiningSiteAction.bind(null, businessId), null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mining Sites</h1>
          <p className="text-muted-foreground">Manage your mining locations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">On Hold</p>
          <p className="text-2xl font-bold text-amber-500">{stats.onHold}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Depleted</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.depleted}</p>
        </div>
      </div>

      {/* New Site Form */}
      <form action={createAction} className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Add New Site</h3>
        <div className="grid grid-cols-2 gap-3">
          <input name="name" placeholder="Site name *" required className="border rounded px-3 py-2 text-sm" />
          <input name="location" placeholder="Location" className="border rounded px-3 py-2 text-sm" />
          <input name="mineralType" placeholder="Mineral type (e.g. gold, coal)" className="border rounded px-3 py-2 text-sm" />
          <input name="size" type="number" step="0.01" placeholder="Size" className="border rounded px-3 py-2 text-sm" />
          <input name="sizeUnit" placeholder="Size unit (hectares, acres)" className="border rounded px-3 py-2 text-sm" />
          <input name="coordinates" placeholder="GPS coordinates" className="border rounded px-3 py-2 text-sm" />
        </div>
        <textarea name="description" placeholder="Description" className="border rounded px-3 py-2 text-sm w-full" rows={2} />
        <button type="submit" disabled={createPending} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
          {createPending ? "Saving..." : "Create Site"}
        </button>
        {createState?.message && (
          <p className={`text-sm ${createState.success ? "text-green-600" : "text-red-600"}`}>{createState.message}</p>
        )}
      </form>

      {/* Sites List */}
      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">All Sites ({sites.length})</h3>
        </div>
        {sites.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No sites yet. Create your first site above.</p>
        ) : (
          sites.map((site: any) => (
            <div key={site.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{site.name}</p>
                <p className="text-xs text-muted-foreground">
                  {site.location && `${site.location} · `}
                  {site.mineralType && `${site.mineralType} · `}
                  {site._count?.equipment || 0} equipment · {site._count?.licenses || 0} licenses
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${site.status === "ACTIVE" ? "bg-green-100 text-green-700" : site.status === "ON_HOLD" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                {site.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
