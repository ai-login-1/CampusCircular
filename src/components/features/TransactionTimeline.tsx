import { Exchange } from "@/lib/exchangeStore";
import { LIFECYCLE_STEPS, STATUS_ORDER, getStepIndex } from "@/lib/lifecycle";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface TransactionTimelineProps {
  transaction: Exchange | any;
}

export default function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  const currentIdx = getStepIndex(transaction.status);
  const isDisputed = transaction.status === "disputed" || transaction.status === "resolved";
  const isRejected = transaction.status === "rejected" || transaction.status === "cancelled";

  if (isRejected) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
        <p className="text-red-600 font-semibold text-sm capitalize">
          {transaction.status === "rejected" ? "Request Rejected" : "Request Cancelled"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {isDisputed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-700 font-medium">
          ⚠️ Dispute {transaction.status === "resolved" ? "Resolved" : "In Progress"}
        </div>
      )}
      <div className="relative">
        <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-100" />
        <div className="space-y-1">
          {LIFECYCLE_STEPS.map((step, i) => {
            const historyEntry = transaction.statusHistory?.find((h: any) => h.status === step.status);
            const isDone = currentIdx >= i;
            const isCurrent = STATUS_ORDER[currentIdx] === step.status;

            return (
              <div key={step.status} className="flex items-start gap-3 relative">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "bg-lime-400" : "bg-gray-100"}`}>
                  {isDone ? (
                    isCurrent ? <Clock className="w-4 h-4 text-gray-900" /> : <CheckCircle className="w-4 h-4 text-gray-900" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isDone ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {isCurrent && (
                      <span className="bg-lime-100 text-lime-700 text-[10px] font-bold px-2 py-0.5 rounded-full">CURRENT</span>
                    )}
                  </div>
                  {historyEntry && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(historyEntry.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {historyEntry.note ? ` · ${historyEntry.note}` : ""}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
