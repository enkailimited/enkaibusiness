"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  listTerritoriesAction,
  createTerritoryAction,
  updateTerritoryAction,
  deleteTerritoryAction,
  assignSalesProfileToTerritoryAction,
  removeSalesProfileFromTerritoryAction,
  listAvailableSalesProfilesAction,
} from "@/features/sales-network/actions/territory-actions";
import { Plus, MapPin, Users, Trash2, Edit3, X, DollarSign, Loader2 } from "lucide-react";

interface TerritoryMember {
  id: string;
  salesProfileId: string;
  isPrimary: boolean;
  salesProfile: {
    user: { id: string; firstName: string; lastName: string; email: string };
    hierarchy: { title: string } | null;
  };
}

interface Territory {
  id: string;
  name: string;
  description: string | null;
  targetRevenue: string | null;
  marketSize: number | null;
  color: string | null;
  isActive: boolean;
  members: TerritoryMember[];
  _count: { leads: number };
}

interface TerritoryFormState {
  name: string;
  description: string;
  targetRevenue: string;
  marketSize: string;
  color: string;
}

const defaultForm: TerritoryFormState = {
  name: "",
  description: "",
  targetRevenue: "",
  marketSize: "",
  color: "#3b82f6",
};

export default function ManageTerritoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Territory | null>(null);
  const [assignTarget, setAssignTarget] = useState<Territory | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [form, setForm] = useState<TerritoryFormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["territories", "manage"],
    queryFn: async () => {
      const res = await listTerritoriesAction();
      if (!res.success) throw new Error(res.message);
      return res.territories;
    },
  });

  const { data: availableProfiles } = useQuery({
    queryKey: ["sales-profiles", "available"],
    queryFn: async () => {
      const res = await listAvailableSalesProfilesAction();
      if (!res.success) throw new Error(res.message);
      return res.profiles;
    },
    enabled: !!assignTarget,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["territories"] });
  }, [queryClient]);

  function openCreate() {
    setForm(defaultForm);
    setCreateOpen(true);
  }

  function openEdit(t: Territory) {
    setForm({
      name: t.name,
      description: t.description ?? "",
      targetRevenue: t.targetRevenue ?? "",
      marketSize: t.marketSize?.toString() ?? "",
      color: t.color ?? "#3b82f6",
    });
    setEditTarget(t);
  }

  function setField<K extends keyof TerritoryFormState>(key: K, value: TerritoryFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", form.name);
      if (form.description) fd.set("description", form.description);
      if (form.targetRevenue) fd.set("targetRevenue", form.targetRevenue);
      if (form.marketSize) fd.set("marketSize", form.marketSize);
      fd.set("color", form.color);
      const res = await createTerritoryAction(null, fd);
      toast({ title: res.success ? "Created" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
      if (res.success) {
        setCreateOpen(false);
        invalidate();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("id", editTarget.id);
      fd.set("name", form.name);
      if (form.description) fd.set("description", form.description);
      if (form.targetRevenue) fd.set("targetRevenue", form.targetRevenue);
      if (form.marketSize) fd.set("marketSize", form.marketSize);
      fd.set("color", form.color);
      const res = await updateTerritoryAction(null, fd);
      toast({ title: res.success ? "Updated" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
      if (res.success) {
        setEditTarget(null);
        invalidate();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    const res = await deleteTerritoryAction(id);
    if (res.success) invalidate();
    toast({ title: res.success ? "Deleted" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
    setDeleteId(null);
  }

  async function handleAssign() {
    if (!assignTarget || !selectedProfile) return;
    const res = await assignSalesProfileToTerritoryAction(assignTarget.id, selectedProfile, false);
    if (res.success) {
      invalidate();
      setSelectedProfile("");
    }
    toast({ title: res.success ? "Assigned" : "Error", description: res.message, variant: res.success ? "default" : "destructive" });
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Manage Territories" description="Create and manage sales territories">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Territory
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-6 w-32 animate-pulse rounded bg-muted mb-4" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MapPin className="mb-4 h-12 w-12" />
            <p className="text-sm">No territories created yet</p>
            <p className="text-xs">Create your first territory to organize your sales regions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((territory) => (
            <Card key={territory.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: territory.color ?? "#3b82f6" }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{territory.name}</CardTitle>
                    {territory.description && (
                      <CardDescription className="mt-1">{territory.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAssignTarget(territory)}>
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(territory)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(territory.id)}>
                      {deleteId === territory.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{territory._count.leads} leads</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{territory.members.length} members</span>
                  </div>
                  {territory.targetRevenue && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{Number(territory.targetRevenue).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {territory.members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {territory.members.map((m) => (
                      <Badge key={m.salesProfileId} variant="secondary" className="text-[10px]">
                        {m.salesProfile.user.firstName} {m.salesProfile.user.lastName}
                        {m.isPrimary && " (Primary)"}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Territory</DialogTitle>
            <DialogDescription>Define a new sales territory</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Revenue</label>
                <Input type="number" step="0.01" value={form.targetRevenue} onChange={(e) => setField("targetRevenue", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Market Size (businesses)</label>
                <Input type="number" value={form.marketSize} onChange={(e) => setField("marketSize", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Input type="color" value={form.color} onChange={(e) => setField("color", e.target.value)} className="h-10" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !form.name.trim()}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Territory</DialogTitle>
            <DialogDescription>Update territory details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Revenue</label>
                <Input type="number" step="0.01" value={form.targetRevenue} onChange={(e) => setField("targetRevenue", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Market Size</label>
                <Input type="number" value={form.marketSize} onChange={(e) => setField("marketSize", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Color</label>
              <Input type="color" value={form.color} onChange={(e) => setField("color", e.target.value)} className="h-10" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !form.name.trim()}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignTarget} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Member</DialogTitle>
            <DialogDescription>Add a sales team member to {assignTarget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              placeholder="Select a sales profile"
              options={availableProfiles?.map((p) => ({
                value: p.id,
                label: `${p.user.firstName} ${p.user.lastName} (${p.hierarchy?.title ?? "No level"})`,
              })) ?? []}
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setAssignTarget(null); setSelectedProfile(""); }}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedProfile}>Assign</Button>
            </div>
          </div>
          {assignTarget && assignTarget.members.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Current members:</p>
              <div className="space-y-2">
                {assignTarget.members.map((m) => (
                  <div key={m.salesProfileId} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>
                      {m.salesProfile.user.firstName} {m.salesProfile.user.lastName}
                      {m.isPrimary && <Badge variant="outline" className="ml-2 text-[10px]">Primary</Badge>}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={async () => {
                        await removeSalesProfileFromTerritoryAction(assignTarget.id, m.salesProfileId);
                        invalidate();
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
