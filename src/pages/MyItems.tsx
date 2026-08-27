import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Eye, CheckCircle, XCircle, Flag } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import EmptyState from "@/components/features/EmptyState";
import StatusBadge from "@/components/features/StatusBadge";
import { resourceStore } from "@/lib/resourceStore";
import { useAuth } from "@/contexts/AuthContext";
import { Resource } from "@/types";
import { toast } from "sonner";

export default function MyItems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<(Resource & { status: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const all = await resourceStore.getByOwner(user.id);
    setItems(all as any[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const toggleAvailability = async (id: string, current: boolean) => {
    await resourceStore.updateAvailability(id, !current);
    toast.success(`Marked as ${!current ? "Available" : "Unavailable"}`);
    load();
  };

  const resourceStatusColor: Record<string, string> = {
    approved: "bg-lime-100 text-lime-700",
    pending_approval: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    flagged: "bg-amber-100 text-amber-700",
    suspended: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Items</h1>
            <p className="text-gray-500 text-sm mt-1">Items you have listed for borrowing</p>
          </div>
          <button onClick={() => toast.info("Item listing coming soon! Contact admin to add resources.")}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            <Plus className="w-4 h-4" /> List New Item
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon="📦" title="You haven't listed anything yet"
            description="Share your unused items with the campus community and earn from them."
            actionLabel="List Your First Item" onAction={() => toast.info("Listing creation coming soon!")} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-all">
                <img src={r.images[0]} alt={r.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${resourceStatusColor[(r as any).status] ?? "bg-gray-100 text-gray-600"}`}>
                      {(r as any).status?.replace(/_/g, " ") ?? "pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{r.category} · ₹{r.dailyRate}/day · {r.condition}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.isAvailable ? "available" : "unavailable"} />
                    <button onClick={() => navigate(`/resources/${r.id}`)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => toggleAvailability(r.id, r.isAvailable)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${r.isAvailable ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-lime-50 text-lime-600 hover:bg-lime-100"}`}>
                      {r.isAvailable ? <><XCircle className="w-3 h-3" /> Mark Unavailable</> : <><CheckCircle className="w-3 h-3" /> Mark Available</>}
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">₹{r.dailyRate}<span className="text-xs font-normal text-gray-400">/day</span></p>
                  <p className="text-xs text-gray-400">+₹{r.securityDeposit} deposit</p>
                  <p className="text-xs text-gray-400 mt-1">★ {r.rating} ({r.reviewCount})</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
