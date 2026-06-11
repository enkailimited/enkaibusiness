import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Building2 } from "lucide-react";
import { INDUSTRY_LABELS } from "../constants";
import type { BusinessWithRelations } from "../types";

interface BusinessCardProps {
  business: BusinessWithRelations;
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{business.name}</CardTitle>
              <CardDescription>{business.slug}</CardDescription>
            </div>
          </div>
          <Badge variant={business.isActive ? "success" : "secondary"}>
            {business.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary">{INDUSTRY_LABELS[business.modes[0]?.industry] ?? business.modes[0]?.industry}</Badge>
          {business.modes.slice(0, 2).map((mode) => (
            <Badge key={mode.id} variant="outline" className="text-xs">
              {mode.mode}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Store className="h-4 w-4" />
            {business._count?.branches ?? 0} branches
          </span>
          <span>{business.currency}</span>
        </div>
      </CardContent>
    </Card>
  );
}
