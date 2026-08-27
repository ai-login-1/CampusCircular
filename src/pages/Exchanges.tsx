import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EmptyState from "@/components/features/EmptyState";
import StatusBadge from "@/components/features/StatusBadge";
import { exchangeStore, Exchange } from "@/lib/exchangeStore";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  handover: "bg-violet-100 text-violet-700",
  borrowed: "bg-lime-100 text-lime-700",
  overdue: "bg-red-100 text-red-700",
  return_due: "bg-orange-100 text-orange-700",
  returned: "bg-gray-100 text-gray-600",
  inspection: "bg-purple-100 text-purple-700",
  settlement: "bg-teal-100 text-teal-700",
  disputed: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  rated: "bg-violet-100 text-violet-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function Exchanges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [tab, setTab] = useState<"borrowing" | "lending">("borrowing");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fn = tab === "borrowing"
      ? exchangeStore.getForBorrower(user.id)
      : exchangeStore.getForOwner(user.id);
    fn.then((data) => {
      setExchanges(data);
      setLoading(false);
    });
  }, [user, tab]);

  const activeCount = exchanges.filter((t) =>
    ["requested", "accepted", "handover", "borrowed", "overdue", "returned", "inspection"].includes(t.status)
  ).length;

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Exchanges</h1>
            <p className="text-gray-500 text-sm mt-1">Full borrowing lifecycle — end to end</p>
          </div>
          {activeCount > 0 && (
            <span className="bg-lime-100 text-lime-700 font-bold text-sm px-4 py-2 rounded-full">{activeCount} active</span>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setTab("borrowing")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "borrowing" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            I'm Borrowing
          </button>
          <button onClick={() => setTab("lending")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "lending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            I'm Lending
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : exchanges.length === 0 ? (
          <EmptyState icon={tab === "borrowing" ? "📦" : "🤝"}
            title={tab === "borrowing" ? "No borrowing exchanges yet" : "No lending exchanges yet"}
            description={tab === "borrowing" ? "Browse and borrow campus resources." : "List an item to start lending."}
            actionLabel={tab === "borrowing" ? "Discover Resources" : "My Items"}
            onAction={() => navigate(tab === "borrowing" ? "/discover" : "/my-items")} />
        ) : (
          <div className="space-y-3">
            {exchanges.map((tx) => (
              <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 p-4 flex gap-4 items-start">
                <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{tx.resourceTitle}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${STATUS_COLORS[tx.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {tx.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {tab === "borrowing" ? `From ${tx.ownerName}` : `To ${tx.borrowerName}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{new Date(tx.requestedFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(tx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>·</span>
                    <span className="font-medium text-gray-600">₹{tx.borrowingFee + tx.platformFee} + ₹{tx.securityDeposit} deposit</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
