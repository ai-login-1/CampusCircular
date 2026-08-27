import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EmptyState from "@/components/features/EmptyState";
import StatusBadge from "@/components/features/StatusBadge";
import { exchangeStore, Exchange } from "@/lib/exchangeStore";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function MyLoans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    exchangeStore.getForBorrower(user.id).then((data) => {
      setExchanges(data);
      setLoading(false);
    });
  }, [user]);

  const active = exchanges.filter((t) => ["accepted", "handover", "borrowed", "overdue", "return_due"].includes(t.status));
  const history = exchanges.filter((t) => ["returned", "inspection", "settlement", "rated", "rejected", "cancelled"].includes(t.status));
  const pending = exchanges.filter((t) => t.status === "requested");

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-gray-900">My Loans</h1>
          <button onClick={() => navigate("/exchanges")} className="text-sm text-violet-600 font-medium hover:text-violet-700">
            View All Exchanges →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Awaiting Owner Response</h2>
                <div className="space-y-3">
                  {pending.map((tx) => (
                    <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                      className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                      <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{tx.resourceTitle}</p>
                        <p className="text-xs text-gray-500">To {tx.ownerName}</p>
                      </div>
                      <StatusBadge status="requested" />
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Currently Borrowing</h2>
              {active.length === 0 ? (
                <EmptyState icon="📦" title="Nothing borrowed right now"
                  description="Browse campus resources and borrow what you need."
                  actionLabel="Discover Resources" onAction={() => navigate("/discover")} />
              ) : (
                <div className="space-y-3">
                  {active.map((tx) => (
                    <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                      <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{tx.resourceTitle}</p>
                        <p className="text-xs text-gray-500">From {tx.ownerName} · {new Date(tx.requestedFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(tx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                      <StatusBadge status={tx.status as any} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Borrow History</h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No past loans yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((tx) => (
                    <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                      <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{tx.resourceTitle}</p>
                        <p className="text-xs text-gray-500">From {tx.ownerName}</p>
                      </div>
                      <StatusBadge status={tx.status as any} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
