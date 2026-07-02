import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyCustomerJWT } from "@/features/customer/auth/service/customer-auth";
import { getBusinessBySlug } from "@/features/customer/catalog/services/catalog-service";
import { getBookableServices } from "@/features/customer/bookings/services/booking-service";
import { BookServiceForm } from "@/features/customer/bookings/components/book-service-form";

export const dynamic = "force-dynamic";

export default async function BookServicePage(props: { searchParams: Promise<{ business?: string; service?: string }> }) {
  const searchParams = await props.searchParams;
  const businessSlug = searchParams.business || "enkai-demo-shop";

  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) redirect(`/customer/auth/login?redirect=/customer/book/new?business=${businessSlug}`);

  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) redirect("/customer/auth/login");

  const business = await getBusinessBySlug(businessSlug);
  if (!business) return <div className="p-6 text-center">Business not found</div>;

  const services = await getBookableServices(business.id);
  const preselected = searchParams.service
    ? services.find((s) => s.slug === searchParams.service)
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href={`/customer/bookings?business=${businessSlug}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to bookings
      </Link>

      <h1 className="text-3xl font-bold">Book a Service</h1>
      <p className="text-muted-foreground">{business.name}</p>

      {services.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No bookable services available yet</p>
          <Link href={`/customer/catalog?business=${businessSlug}`} className="text-primary hover:underline block mt-2">
            Browse catalog
          </Link>
        </div>
      ) : (
        <BookServiceForm
          services={services.map((s) => ({
            id: s.id, name: s.name, slug: s.slug, price: Number(s.price), description: s.description,
          }))}
          preselectedServiceId={preselected?.id || null}
          businessId={business.id}
          businessSlug={businessSlug}
        />
      )}
    </div>
  );
}
