import { requireAuth } from "@/server/auth";
import { getWalletInfo } from "../services/wallet-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WalletViewProps {
  businessId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
  }).format(amount);
}

export async function WalletView({ businessId }: WalletViewProps) {
  await requireAuth();
  const wallet = await getWalletInfo(businessId);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Current Balance</CardDescription>
          <CardTitle className="text-3xl font-bold">
            {formatCurrency(wallet.balance)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Available for subscription payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Deposited</CardDescription>
          <CardTitle className="text-2xl font-bold text-green-600">
            {formatCurrency(wallet.totalDeposited)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Lifetime deposits
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Consumed</CardDescription>
          <CardTitle className="text-2xl font-bold text-orange-600">
            {formatCurrency(wallet.totalConsumed)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Lifetime consumption
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Bonus Balance</CardDescription>
          <CardTitle className="text-2xl font-bold text-blue-600">
            {formatCurrency(wallet.bonusBalance)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Bonus credits
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
