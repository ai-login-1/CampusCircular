type StatusType = "active" | "pending" | "returned" | "overdue" | "approved" | "rejected" | "available" | "unavailable"
  | "requested" | "accepted" | "handover" | "borrowed" | "return_due" | "inspection" | "disputed" | "resolved" | "settlement" | "rated" | "cancelled";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-lime-100 text-lime-700 border border-lime-200" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  returned: { label: "Returned", className: "bg-gray-100 text-gray-600 border border-gray-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 border border-red-200" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-700 border border-blue-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border border-red-200" },
  available: { label: "Available", className: "bg-lime-100 text-lime-700 border border-lime-200" },
  unavailable: { label: "Unavailable", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  requested: { label: "Requested", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700 border border-blue-200" },
  handover: { label: "Handover", className: "bg-violet-100 text-violet-700 border border-violet-200" },
  borrowed: { label: "Borrowed", className: "bg-lime-100 text-lime-700 border border-lime-200" },
  return_due: { label: "Return Due", className: "bg-orange-100 text-orange-700 border border-orange-200" },
  inspection: { label: "Inspection", className: "bg-purple-100 text-purple-700 border border-purple-200" },
  disputed: { label: "Disputed", className: "bg-amber-100 text-amber-700 border border-amber-200" },
  resolved: { label: "Resolved", className: "bg-teal-100 text-teal-700 border border-teal-200" },
  settlement: { label: "Settlement", className: "bg-blue-100 text-blue-700 border border-blue-200" },
  rated: { label: "Rated", className: "bg-violet-100 text-violet-700 border border-violet-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" || status === "available" || status === "approved" ? "bg-current" : "bg-current opacity-60"}`} />
      {config.label}
    </span>
  );
}
