"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Fingerprint, UserCheck, Phone, Users } from "lucide-react";

export function SalesInfoStep() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <MapPin className="h-4 w-4" />
        Residence &amp; Guarantor
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          <MapPin className="mr-1 inline h-3 w-3" />
          Physical Address <span className="text-destructive">*</span>
        </Label>
        <Input id="address" name="address" placeholder="e.g. Mwenge, Dar es Salaam" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nida">
          <Fingerprint className="mr-1 inline h-3 w-3" />
          NIDA Number <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input id="nida" name="nida" placeholder="e.g. 19800101-12345-67890" />
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <UserCheck className="h-4 w-4" />
          Guarantor Information
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guarantorFullName">
              <UserCheck className="mr-1 inline h-3 w-3" />
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input id="guarantorFullName" name="guarantorFullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guarantorPhone">
              <Phone className="mr-1 inline h-3 w-3" />
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input id="guarantorPhone" name="guarantorPhone" type="tel" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label htmlFor="guarantorRelationship">
              <Users className="mr-1 inline h-3 w-3" />
              Relationship <span className="text-destructive">*</span>
            </Label>
            <Input id="guarantorRelationship" name="guarantorRelationship" placeholder="e.g. Parent, Spouse, Sibling" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guarantorAddress">
              <MapPin className="mr-1 inline h-3 w-3" />
              Address <span className="text-destructive">*</span>
            </Label>
            <Input id="guarantorAddress" name="guarantorAddress" placeholder="e.g. Kinondoni, Dar es Salaam" required />
          </div>
        </div>
      </div>
    </div>
  );
}
