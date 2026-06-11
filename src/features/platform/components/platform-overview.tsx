"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlatformStatsAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function PlatformOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["platform", "stats"],
    queryFn: () => getPlatformStatsAction(),
  });

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Unable to load platform stats</p>;
  }

  const cards = [
    { label: "Businesses", value: stats.totalBusinesses },
    { label: "Users", value: stats.totalUsers },
    { label: "Staff", value: stats.totalStaff },
    { label: "Sales", value: stats.totalSales },
    { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}` },
    { label: "Active Subscriptions", value: stats.activeSubscriptions },
    { label: "Pending Leads", value: stats.pendingLeads },
    { label: "Open Tickets", value: stats.openSupportTickets },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
