import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EmptyState from "@/components/features/EmptyState";
import StatusBadge from "@/components/features/StatusBadge";
import { exchangeStore, Exchange } from "@/lib/exchangeStore";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function MyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    exchangeStore.getForBorrower(user.id).then((data) => {
      setExchanges(data.filter((t) => t.status === "requested"));
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-gray-900">My Requests</h1>
          <button onClick={() => navigate("/exchanges")} className="text-sm text-violet-600 font-medium hover:text-violet-700">
            View All Exchanges →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : exchanges.length === 0 ? (
          <EmptyState icon="📩" title="No pending requests"
            description="Request to borrow resources from other students."
            actionLabel="Discover Resources" onAction={() => navigate("/discover")} />
        ) : (
          <div className="space-y-4">
            {exchanges.map((tx) => (
              <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5 flex items-start gap-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 leading-tight">{tx.resourceTitle}</h3>
                    <StatusBadge status="requested" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">To <span className="font-medium text-gray-700">{tx.ownerName}</span></p>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(tx.requestedFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
                    {new Date(tx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {tx.days} day{tx.days > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2 italic">"{tx.purpose}"</p>
                  <p className="text-xs text-gray-400 mt-2">Total: ₹{tx.borrowingFee + tx.platformFee} + ₹{tx.securityDeposit} deposit</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
