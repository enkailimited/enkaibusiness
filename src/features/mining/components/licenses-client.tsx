"use client";

import { useActionState } from "react";
import { createMiningLicenseAction } from "../actions";

export function MiningLicensesClient({ businessId, licenses, stats, expiring }: any) {
  const [createState, createAction, createPending] = useActionState(createMiningLicenseAction.bind(null, businessId), null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mining Licenses</h1>
        <p className="text-muted-foreground">Manage claims, licenses, and permits</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Expiring Soon</p><p className="text-2xl font-bold text-red-500">{expiring.length}</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Expired</p><p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p></div>
      </div>

      <form action={createAction} className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Add New License</h3>
        <div className="grid grid-cols-2 gap-3">
          <input name="licenseNumber" placeholder="License number *" required className="border rounded px-3 py-2 text-sm" />
          <input name="type" placeholder="Type (mining_license, claim, permit, exploration)" className="border rounded px-3 py-2 text-sm" />
          <input name="issuingBody" placeholder="Issuing body" className="border rounded px-3 py-2 text-sm" />
          <input name="issueDate" type="date" required className="border rounded px-3 py-2 text-sm" />
          <input name="expiryDate" type="date" className="border rounded px-3 py-2 text-sm" />
          <input name="documentUrl" placeholder="Document URL" className="border rounded px-3 py-2 text-sm" />
        </div>
        <textarea name="description" placeholder="Description" className="border rounded px-3 py-2 text-sm w-full" rows={2} />
        <button type="submit" disabled={createPending} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
          {createPending ? "Saving..." : "Create License"}
        </button>
      </form>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">All Licenses ({licenses.length})</h3></div>
        {licenses.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No licenses yet.</p>
        ) : (
          licenses.map((lic: any) => (
            <div key={lic.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{lic.licenseNumber}</p>
                <p className="text-xs text-muted-foreground">{lic.type} · {lic.issuingBody || "N/A"} · {lic.site?.name || "No site"}</p>
                <p className="text-xs text-muted-foreground">Issued: {new Date(lic.issueDate).toLocaleDateString()}{lic.expiryDate ? ` · Expires: ${new Date(lic.expiryDate).toLocaleDateString()}` : ""}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${lic.status === "ACTIVE" ? "bg-green-100 text-green-700" : lic.status === "PENDING" ? "bg-amber-100 text-amber-700" : lic.status === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>
                {lic.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
