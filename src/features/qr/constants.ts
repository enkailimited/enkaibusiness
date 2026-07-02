export type QRMode =
  | "COMMERCE_BROWSE" | "COMMERCE_ORDER"
  | "RESTAURANT_MENU" | "RESTAURANT_ORDER" | "RESTAURANT_PAY"
  | "HEALTHCARE_APPOINTMENT" | "HEALTHCARE_QUEUE" | "HEALTHCARE_SERVICES"
  | "EDUCATION_ADMISSIONS" | "EDUCATION_PARENT_PORTAL" | "EDUCATION_ATTENDANCE" | "EDUCATION_FEES" | "EDUCATION_REPORTS"
  | "HOTEL_ROOM_SERVICE" | "HOTEL_CHECKIN" | "HOTEL_HOUSEKEEPING"
  | "MANUFACTURING_MACHINE" | "MANUFACTURING_MAINTENANCE"
  | "AGRICULTURE_FARM" | "AGRICULTURE_EQUIPMENT"
  | "REAL_ESTATE_PROPERTY" | "REAL_ESTATE_VIEWING"
  | "SERVICES_BOOKING"
  | "LOGISTICS_TRACKING"
  | "NON_PROFIT_DONATION"
  | "GENERAL_INFO";

export const QR_MODES_BY_INDUSTRY: Record<string, { value: QRMode; label: string; description: string }[]> = {
  COMMERCE: [
    { value: "COMMERCE_BROWSE", label: "Browse Catalog", description: "Scan to browse products" },
    { value: "COMMERCE_ORDER", label: "Order Online", description: "Scan to place orders" },
  ],
  RESTAURANT: [
    { value: "RESTAURANT_MENU", label: "Digital Menu", description: "Scan to view menu" },
    { value: "RESTAURANT_ORDER", label: "Self Ordering", description: "Scan to order from table" },
    { value: "RESTAURANT_PAY", label: "Pay at Table", description: "Scan to pay bill" },
  ],
  HEALTHCARE: [
    { value: "HEALTHCARE_APPOINTMENT", label: "Book Appointment", description: "Scan to book appointment" },
    { value: "HEALTHCARE_QUEUE", label: "Queue Status", description: "Scan to check queue" },
    { value: "HEALTHCARE_SERVICES", label: "View Services", description: "Scan to view services" },
  ],
  EDUCATION: [
    { value: "EDUCATION_ADMISSIONS", label: "Admissions", description: "Scan to apply" },
    { value: "EDUCATION_PARENT_PORTAL", label: "Parent Portal", description: "Scan for parent dashboard" },
    { value: "EDUCATION_ATTENDANCE", label: "Attendance", description: "Scan to mark attendance" },
    { value: "EDUCATION_FEES", label: "Fee Payment", description: "Scan to pay fees" },
    { value: "EDUCATION_REPORTS", label: "Reports", description: "Scan for student reports" },
  ],
  LOGISTICS: [
    { value: "LOGISTICS_TRACKING", label: "Track Shipment", description: "Scan to track delivery" },
  ],
  REAL_ESTATE: [
    { value: "REAL_ESTATE_PROPERTY", label: "Property Info", description: "Scan for property details" },
    { value: "REAL_ESTATE_VIEWING", label: "Schedule Viewing", description: "Scan to schedule viewing" },
  ],
  SERVICES: [
    { value: "SERVICES_BOOKING", label: "Book Service", description: "Scan to book appointment" },
    { value: "GENERAL_INFO", label: "General Info", description: "Scan for information" },
  ],
  MANUFACTURING: [
    { value: "MANUFACTURING_MACHINE", label: "Machine Info", description: "Scan for machine details" },
    { value: "MANUFACTURING_MAINTENANCE", label: "Maintenance", description: "Scan for maintenance log" },
  ],
  AGRICULTURE: [
    { value: "AGRICULTURE_FARM", label: "Farm Info", description: "Scan for farm details" },
    { value: "AGRICULTURE_EQUIPMENT", label: "Equipment", description: "Scan for equipment info" },
  ],
  NON_PROFIT: [
    { value: "NON_PROFIT_DONATION", label: "Donate", description: "Scan to donate" },
  ],
  HOTEL: [
    { value: "HOTEL_ROOM_SERVICE", label: "Room Service", description: "Scan for room service" },
    { value: "HOTEL_CHECKIN", label: "Check-in", description: "Scan to check in" },
    { value: "HOTEL_HOUSEKEEPING", label: "Housekeeping", description: "Scan to request service" },
  ],
};
