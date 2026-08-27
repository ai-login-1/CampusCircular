import { Loan } from "@/types";
import StatusBadge from "./StatusBadge";

interface BorrowingTimelineProps {
  loans: Loan[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BorrowingTimeline({ loans }: BorrowingTimelineProps) {
  if (loans.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">No borrowing history yet.</div>
    );
  }

  return (
    <div className="space-y-3">
      {loans.map((loan) => (
        <div key={loan.id} className="flex gap-4 items-start bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <img
            src={loan.resourceImage}
            alt={loan.resourceTitle}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{loan.resourceTitle}</p>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(loan.startDate)} → {formatDate(loan.endDate)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              From <span className="font-medium text-gray-600">{loan.lenderName}</span> · ₹{loan.totalCost} + ₹{loan.deposit} deposit
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
