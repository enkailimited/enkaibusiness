export function TicketStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVATED: "bg-green-100 text-green-800",
    DECLINED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    AWAITING_APPROVAL: "bg-purple-100 text-purple-800",
    CUSTOMER_TEST_COMPLETED: "bg-blue-100 text-blue-800",
    TESTING_IN_PROGRESS: "bg-indigo-100 text-indigo-800",
    DISTRIBUTOR_ASSIGNED: "bg-cyan-100 text-cyan-800",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
