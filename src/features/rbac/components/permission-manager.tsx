"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Permission } from "@prisma/client";

interface PermissionManagerProps {
  permissions: Permission[];
  assignedPermissionIds: string[];
  onAssign: (permissionId: string) => void;
  onRemove: (permissionId: string) => void;
}

export function PermissionManager({ permissions, assignedPermissionIds, onAssign, onRemove }: PermissionManagerProps) {
  const [search, setSearch] = useState("");
  const filtered = permissions.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.module.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module}>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{module}</h4>
              <div className="space-y-1">
                {perms.map((perm) => {
                  const assigned = assignedPermissionIds.includes(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{perm.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{perm.slug}</span>
                      </div>
                      <Button
                        variant={assigned ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => assigned ? onRemove(perm.id) : onAssign(perm.id)}
                      >
                        {assigned ? "Remove" : "Assign"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
