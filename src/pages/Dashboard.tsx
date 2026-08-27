import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Clock, CheckCircle, X, Loader2, Bell } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/features/SearchBar";
import CategoryCard from "@/components/features/CategoryCard";
import ResourceCard from "@/components/features/ResourceCard";
import TrustScore from "@/components/features/TrustScore";
import StatusBadge from "@/components/features/StatusBadge";
import AINeedSearch from "@/components/features/AINeedSearch";
import { useAuth } from "@/contexts/AuthContext";
import { resourceStore } from "@/lib/resourceStore";
import { exchangeStore, Exchange } from "@/lib/exchangeStore";
import { Resource, ResourceCategory } from "@/types";

const CATEGORIES: ResourceCategory[] = ["Cameras", "Electronics", "Books", "Sports", "Music", "Event Equipment"];
const CATEGORY_COUNTS: Record<ResourceCategory, number> = {
  Cameras: 12, Electronics: 24, Books: 87, Sports: 19, Music: 8, "Event Equipment": 14,
};

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nlQuery, setNlQuery] = useState("");
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [transactions, setTransactions] = useState<Exchange[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const [res, exs] = await Promise.all([
        resourceStore.getApproved(),
        exchangeStore.getForBorrower(user.id),
      ]);
      setResources(res);
      setTransactions(exs);
      setLoading(false);
    }
    load();
  }, [user]);

  const activeTx = transactions.find((t) => ["borrowed", "handover", "accepted"].includes(t.status));
  const pendingTxs = transactions.filter((t) => t.status === "requested");
  const recommended = resources.slice(0, 4);

  const handleSearch = (q: string) => { setAiQuery(q); setShowAISearch(true); };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8 max-w-[calc(100vw-256px)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">{getGreeting()},</p>
            <h1 className="text-3xl font-black text-gray-900">{user?.name.split(" ")[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.department} · {user?.year}</p>
          </div>
          <div className="flex items-center gap-3">
            <TrustScore score={user?.trustScore ?? 0} size="md" />
          </div>
        </div>

        {/* Hero Search */}
        <div className="bg-gray-900 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400 opacity-10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 right-32 w-32 h-32 bg-violet-500 opacity-10 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 text-sm font-medium">Smart Search — try natural language</span>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">What do you need today?</h2>
            <p className="text-gray-400 text-sm mb-5">
              Try:{" "}
              <em className="text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSearch("I need to make a reel for my club event tomorrow")}>
                "I need to make a reel for my club event tomorrow"
              </em>
            </p>
            <SearchBar size="hero" value={nlQuery} onChange={setNlQuery} onSearch={handleSearch}
              placeholder="Describe what you need in plain English..." />
          </div>
        </div>

        {/* AI Search Panel */}
        {showAISearch && (
          <div className="fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowAISearch(false)} />
            <div className="w-[520px] bg-gray-900 h-full flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lime-400" />
                  <h2 className="text-white font-bold text-lg">Smart Resource Finder</h2>
                </div>
                <button onClick={() => setShowAISearch(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
              <div className="flex-1 px-6 py-5 overflow-y-auto">
                <AINeedSearch initialQuery={aiQuery} resources={resources} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-8">
            {/* Quick Categories */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Browse by Category</h2>
                <button onClick={() => navigate("/discover")} className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <CategoryCard key={cat} category={cat} count={CATEGORY_COUNTS[cat]}
                    onClick={() => navigate(`/discover?cat=${cat}`)} />
                ))}
              </div>
            </section>

            {/* Recommended */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
                <button onClick={() => navigate("/discover")} className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recommended.map((r) => <ResourceCard key={r.id} resource={r} showMatch />)}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {activeTx ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Active Borrowing</h3>
                  <StatusBadge status={activeTx.status as any} />
                </div>
                <img src={activeTx.resourceImage} alt={activeTx.resourceTitle}
                  className="w-full h-28 object-cover rounded-xl mb-3" />
                <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{activeTx.resourceTitle}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <Clock className="w-3 h-3" />
                  Return by {new Date(activeTx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
                <button onClick={() => navigate(`/exchanges/${activeTx.id}`)}
                  className="w-full bg-gray-900 text-white py-2 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-colors">
                  View Exchange
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
                <p className="text-gray-400 text-sm">No active loans</p>
                <button onClick={() => navigate("/discover")} className="mt-2 text-violet-600 text-sm font-medium hover:text-violet-700">
                  Discover resources →
                </button>
              </div>
            )}

            {/* Pending Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Pending Requests</h3>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">{pendingTxs.length}</span>
              </div>
              <div className="space-y-2">
                {pendingTxs.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-2">No pending requests</p>
                ) : pendingTxs.map((tx) => (
                  <div key={tx.id} onClick={() => navigate(`/exchanges/${tx.id}`)}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl p-1 -mx-1 transition-colors">
                    <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{tx.resourceTitle}</p>
                      <p className="text-[10px] text-gray-400">to {tx.ownerName}</p>
                    </div>
                    <StatusBadge status="requested" size="sm" />
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/exchanges")} className="mt-3 w-full text-xs text-violet-600 font-medium hover:text-violet-700">
                View all exchanges →
              </button>
            </div>

            {/* Trust Score Card */}
            <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl p-5 text-gray-900">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" />
                <h3 className="font-bold text-sm">Your Trust Score</h3>
              </div>
              <p className="text-5xl font-black mb-1">{user?.trustScore}</p>
              <p className="text-lime-800 text-xs mb-3">Campus Verified · {user?.successfulExchanges} exchanges</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-lime-800">Successful returns</span>
                  <span className="font-bold">{user?.successfulExchanges}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-lime-800">Late returns</span>
                  <span className="font-bold">{user?.lateReturns}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-lime-800">Rating</span>
                  <span className="font-bold">★ {user?.rating}</span>
                </div>
              </div>
              <button onClick={() => navigate("/profile")}
                className="mt-4 w-full bg-gray-900 text-white py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
