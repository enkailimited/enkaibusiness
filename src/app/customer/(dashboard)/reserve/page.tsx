import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { ReservationForm } from "@/features/customer/bookings/components/reservation-form";

export const dynamic = "force-dynamic";

export default async function ReservePage(props: { searchParams: Promise<{ business?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/reserve?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href={`/customer/bookings?business=${businessSlug}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to bookings
      </Link>

      <h1 className="text-3xl font-bold">Make a Reservation</h1>
      <p className="text-muted-foreground">{business.name}</p>

      <ReservationForm businessId={business.id} businessSlug={businessSlug} />
    </div>
  );
}
