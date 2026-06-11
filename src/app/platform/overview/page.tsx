import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, TrendingUp, Users, DollarSign } from "lucide-react";

const stats = [
  { title: "Total Revenue", value: "TSh 0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Active Users", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Growth Rate", value: "0%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  { title: "Avg Transaction", value: "TSh 0", icon: AreaChart, color: "text-amber-600", bg: "bg-amber-100" },
];

export default function PlatformOverviewPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Intelligent Analytics"
        description="Platform-wide performance overview and insights."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={stat.bg + " p-2 rounded-lg " + stat.color}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Analytics chart coming soon
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Analytics chart coming soon
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
