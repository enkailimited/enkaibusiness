import Link from "next/link";

interface QRExperience {
  code: string;
  label: string | null;
  mode: string;
  status: string;
  destinationUrl: string | null;
  business: { id: string; name: string; slug: string; currency: string };
  branch: { id: string; name: string; address: string | null } | null;
}

const INDUSTRY_INFO: Record<string, { icon: string; title: string; description: string }> = {
  COMMERCE: { icon: "🛍️", title: "Welcome to our Store", description: "Browse our catalog and place orders" },
  RESTAURANT: { icon: "🍽️", title: "Welcome to our Restaurant", description: "View menu, order, and pay from your table" },
  HEALTHCARE: { icon: "🏥", title: "Healthcare Services", description: "Book appointments and access services" },
  EDUCATION: { icon: "📚", title: "Education Portal", description: "Access admissions, fees, and reports" },
  HOTEL: { icon: "🏨", title: "Hotel Services", description: "Room service, check-in, and more" },
  MANUFACTURING: { icon: "🏭", title: "Manufacturing", description: "Machine info and maintenance" },
  AGRICULTURE: { icon: "🌾", title: "Agriculture", description: "Farm and equipment information" },
  REAL_ESTATE: { icon: "🏠", title: "Real Estate", description: "Property info and viewing" },
  SERVICES: { icon: "🔧", title: "Services", description: "Book appointments and services" },
  LOGISTICS: { icon: "🚚", title: "Logistics", description: "Track shipments and deliveries" },
  NON_PROFIT: { icon: "🤝", title: "Non-Profit", description: "Donate and learn about our cause" },
};

export function QrGeneralInfo({ experience, industry }: { experience: QRExperience; industry: string }) {
  const info = INDUSTRY_INFO[industry] || INDUSTRY_INFO.COMMERCE;

  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">{info.icon}</div>
      <h1 className="text-3xl font-bold">{info.title}</h1>
      <p className="text-muted-foreground max-w-md mx-auto">{info.description}</p>

      <div className="bg-muted p-6 rounded-lg text-left max-w-md mx-auto space-y-3">
        <p className="text-lg font-semibold">{experience.business.name}</p>
        {experience.branch && (
          <div className="text-sm text-muted-foreground">
            <p>{experience.branch.name}</p>
            {experience.branch.address && <p>{experience.branch.address}</p>}
          </div>
        )}
        <Link
          href={`/customer/catalog?business=${experience.business.slug}`}
          className="block text-center bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
