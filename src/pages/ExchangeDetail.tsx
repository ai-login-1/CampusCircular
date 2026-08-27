import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Clock, Package, AlertTriangle, Star, Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TransactionTimeline from "@/components/features/TransactionTimeline";
import ExchangeSummaryCard from "@/components/features/ExchangeSummaryCard";
import UserAvatar from "@/components/features/UserAvatar";
import { exchangeStore, Exchange, ExchangeStatus } from "@/lib/exchangeStore";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifyExchangeEvent, getAdminIds } from "@/lib/notificationService";

const DEFAULT_CHECKLIST = [
  { label: "Main unit intact, no cracks or dents", checked: false },
  { label: "All accessories present", checked: false },
  { label: "Functional check passed", checked: false },
  { label: "Clean and free of dirt/stains", checked: false },
  { label: "Cables and connectors undamaged", checked: false },
];

type Panel = "timeline" | "agreement" | "inspection" | "settlement" | "dispute" | "rating";

export default function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tx, setTx] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<Panel>("timeline");
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [conditionAfter, setConditionAfter] = useState<"Excellent" | "Good" | "Fair">("Good");
  const [damageFee, setDamageFee] = useState(0);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [platformFeeRate, setPlatformFeeRate] = useState(0.05);
  const [dispute, setDispute] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [ex, settingsRes, disputeRes] = await Promise.all([
        exchangeStore.getById(id),
        supabase.from("platform_settings").select("value").eq("key", "platform_fee_rate").single(),
        supabase.from("disputes").select("*").eq("exchange_id", id).single(),
      ]);
      setTx(ex);
      if (ex?.inspectionChecklist) setChecklist(ex.inspectionChecklist as any);
      if (settingsRes.data) setPlatformFeeRate(Number(settingsRes.data.value));
      if (disputeRes.data) setDispute(disputeRes.data);

      if (ex) {
        const { data: r } = await supabase.from("ratings").select("*").eq("exchange_id", ex.id);
        setRatings(r ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const reload = async () => {
    if (!id) return;
    const ex = await exchangeStore.getById(id);
    setTx(ex);
    if (ex?.inspectionChecklist) setChecklist(ex.inspectionChecklist as any);
    const { data: r } = await supabase.from("ratings").select("*").eq("exchange_id", id);
    setRatings(r ?? []);
    const { data: d } = await supabase.from("disputes").select("*").eq("exchange_id", id).single();
    if (d) setDispute(d);
  };

  const advance = async (status: ExchangeStatus, note?: string) => {
    if (!id || !tx) return;
    setSubmitting(true);
    try {
      const updated = await exchangeStore.advance(id, status, note);
      setTx(updated);
      toast.success(`Status updated to: ${status.replace(/_/g, " ")}`);
      // Fire notifications
      const adminIds = await getAdminIds();
      notifyExchangeEvent(status, id, tx.borrowerId, tx.borrowerName, tx.ownerId, tx.ownerName, tx.resourceTitle, adminIds);
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const submitInspection = async () => {
    if (!id || !tx) return;
    setSubmitting(true);
    try {
      const updated = await exchangeStore.updateInspection(id, checklist, conditionAfter, damageFee, tx);
      setTx(updated);
      toast.success("Inspection submitted. Settlement ready.");
      setActivePanel("settlement");
      notifyExchangeEvent("settlement", id, tx.borrowerId, tx.borrowerName, tx.ownerId, tx.ownerName, tx.resourceTitle);
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const raiseDispute = async () => {
    if (!disputeReason.trim() || !disputeDesc.trim()) { toast.error("Fill in all dispute details."); return; }
    if (!id || !tx || !user) return;
    setSubmitting(true);
    try {
      const updated = await exchangeStore.raiseDispute(id, {
        raisedById: user.id,
        raisedByName: user.name,
        reason: disputeReason,
        description: disputeDesc,
        evidenceLabels: checklist.filter((c) => !c.checked).map((c) => c.label),
      }, tx);
      setTx(updated);
      await reload();
      toast.success("Dispute raised. Admin will review within 24 hours.");
      const adminIds = await getAdminIds();
      notifyExchangeEvent("disputed", id, tx.borrowerId, tx.borrowerName, tx.ownerId, tx.ownerName, tx.resourceTitle, adminIds);
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const submitRating = async () => {
    if (!reviewText.trim()) { toast.error("Please write a short review."); return; }
    if (!id || !user || !tx) return;
    setSubmitting(true);
    try {
      const isOwner = tx.ownerId === user.id;
      const updated = await exchangeStore.addRating(id, {
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId: isOwner ? tx.borrowerId : tx.ownerId,
        toUserName: isOwner ? tx.borrowerName : tx.ownerName,
        rating: ratingVal,
        review: reviewText,
        role: isOwner ? "owner_to_borrower" : "borrower_to_owner",
      }, tx);
      setTx(updated);
      await reload();
      toast.success("Rating submitted!");
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </main>
    </div>
  );

  if (!tx) return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-900">Exchange not found</h2>
          <button onClick={() => navigate("/exchanges")} className="mt-4 text-violet-600 font-medium">Back to Exchanges</button>
        </div>
      </main>
    </div>
  );

  const isOwner = user?.id === tx.ownerId;
  const isBorrower = user?.id === tx.borrowerId;
  const viewAs = isOwner ? "owner" : "borrower";

  const renderActions = () => {
    switch (tx.status) {
      case "requested":
        if (isOwner) return (
          <div className="flex gap-3">
            <button onClick={() => advance("accepted", "Accepted by owner")} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept Request
            </button>
            <button onClick={() => advance("rejected", "Rejected by owner")} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-3 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        );
        if (isBorrower) return (
          <button onClick={() => advance("cancelled", "Cancelled by borrower")} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Cancel Request
          </button>
        );
        break;
      case "accepted":
        if (isOwner) return (
          <button onClick={() => advance("handover", "Item handed over")} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Confirm Handover
          </button>
        );
        break;
      case "handover":
        if (isBorrower) return (
          <button onClick={() => advance("borrowed", "Borrowing confirmed")} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm Receipt
          </button>
        );
        break;
      case "borrowed":
      case "overdue":
        return (
          <div className="space-y-2">
            {isBorrower && (
              <button onClick={() => advance("returned", tx.status === "overdue" ? "Late return by borrower" : "Return initiated")} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {tx.status === "overdue" ? "Mark as Returned (Late)" : "Mark as Returned"}
              </button>
            )}
            {tx.status === "borrowed" && (
              <button onClick={() => advance("overdue", "Item overdue")} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-2xl text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50">
                <Clock className="w-4 h-4" /> Mark Overdue
              </button>
            )}
          </div>
        );
      case "returned":
        if (isOwner) return (
          <button onClick={() => { setActivePanel("inspection"); advance("inspection", "Inspection started"); }} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Start Inspection
          </button>
        );
        break;
      case "settlement":
        return (
          <button onClick={() => setActivePanel("rating")}
            className="w-full flex items-center justify-center gap-2 bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors">
            <Star className="w-4 h-4" /> Proceed to Rating
          </button>
        );
    }
    return null;
  };

  const statusColor = {
    borrowed: "bg-lime-100 text-lime-700", accepted: "bg-blue-100 text-blue-700",
    overdue: "bg-red-100 text-red-700", disputed: "bg-amber-100 text-amber-700",
    rated: "bg-violet-100 text-violet-700", requested: "bg-yellow-100 text-yellow-700",
  }[tx.status] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Exchange</h1>
            <p className="text-gray-400 text-sm mt-0.5">#{tx.id.slice(0, 8)}...</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${statusColor}`}>
            {tx.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Left */}
          <div className="col-span-3 space-y-4">
            {/* Panel nav */}
            <div className="flex gap-2 flex-wrap">
              {(["timeline", "agreement", "inspection", "settlement", "dispute", "rating"] as Panel[]).map((p) => (
                <button key={p} onClick={() => setActivePanel(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
                    ${activePanel === p ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                  {p}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {activePanel === "timeline" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Exchange Lifecycle</h3>
                <TransactionTimeline transaction={{ ...tx, statusHistory: tx.statusHistory } as any} />
              </div>
            )}

            {/* Agreement */}
            {activePanel === "agreement" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Borrowing Agreement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Borrower</p>
                    <div className="flex items-center gap-2">
                      <UserAvatar src={tx.borrowerAvatar} name={tx.borrowerName} size="sm" isVerified />
                      <p className="text-sm font-semibold text-gray-900">{tx.borrowerName}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Owner</p>
                    <div className="flex items-center gap-2">
                      <UserAvatar src={tx.ownerAvatar} name={tx.ownerName} size="sm" isVerified />
                      <p className="text-sm font-semibold text-gray-900">{tx.ownerName}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Duration", `${tx.days} day${tx.days > 1 ? "s" : ""}`],
                    ["Condition at handover", tx.resourceConditionBefore],
                    ["Return deadline", new Date(tx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
                    ["Security deposit", `₹${tx.securityDeposit} (refundable)`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Purpose</p>
                  <p className="text-sm text-gray-700 italic">"{tx.purpose}"</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 mb-2">Responsibilities</p>
                  <ul className="space-y-1 text-xs text-amber-800">
                    <li>• Return the item in the same condition as received.</li>
                    <li>• Notify the owner immediately of any damage or loss.</li>
                    <li>• Late returns incur ₹{tx.dailyRate}/day additional charge.</li>
                    <li>• Security deposit refunded within 24 hours of clean inspection.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Inspection */}
            {activePanel === "inspection" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h3 className="font-bold text-gray-900 text-lg">Return Inspection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">Before</div>
                    <div className="h-28"><img src={tx.resourceImage} alt="before" className="w-full h-full object-cover" /></div>
                    <div className="px-3 py-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{tx.resourceConditionBefore}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-violet-200 overflow-hidden">
                    <div className="bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600">After (Inspect now)</div>
                    <div className="h-28 bg-violet-50 flex items-center justify-center">
                      <div className="text-center"><p className="text-3xl mb-1">📷</p><p className="text-xs text-violet-400">Upload photo</p></div>
                    </div>
                    <div className="px-3 py-2">
                      <select value={conditionAfter} onChange={(e) => setConditionAfter(e.target.value as any)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-300">
                        <option>Excellent</option><option>Good</option><option>Fair</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Condition Checklist</p>
                  <div className="space-y-2">
                    {checklist.map((item, i) => (
                      <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${item.checked ? "bg-lime-50 border-lime-200" : "bg-gray-50 border-gray-200"}`}>
                        <input type="checkbox" checked={item.checked}
                          onChange={(e) => setChecklist(checklist.map((c, j) => j === i ? { ...c, checked: e.target.checked } : c))}
                          className="w-4 h-4 accent-lime-500" />
                        <span className={`text-sm ${item.checked ? "text-lime-700 font-medium" : "text-gray-600"}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Damage / Loss Fee (₹)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={damageFee} min={0} onChange={(e) => setDamageFee(Number(e.target.value))}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <span className="text-xs text-gray-400">from ₹{tx.securityDeposit} deposit</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Deposit refund: ₹{Math.max(0, tx.securityDeposit - damageFee)}</p>
                </div>
                <button onClick={submitInspection} disabled={submitting}
                  className="w-full bg-violet-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Inspection & Proceed to Settlement
                </button>
              </div>
            )}

            {/* Settlement */}
            {activePanel === "settlement" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Settlement Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Borrowing charge (₹{tx.dailyRate}/day × {tx.days}d)</span>
                    <span className="font-semibold">₹{tx.borrowingFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Platform fee ({(platformFeeRate * 100).toFixed(0)}%)</span>
                    <span className="font-semibold">₹{tx.platformFee}</span>
                  </div>
                  {tx.lateFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Late return fee</span>
                      <span className="font-semibold text-red-600">₹{tx.lateFee}</span>
                    </div>
                  )}
                  {tx.damageFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Damage / loss fee</span>
                      <span className="font-semibold text-red-600">₹{tx.damageFee}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold">
                    <span className="text-gray-700">= Transaction amount</span>
                    <span className="text-gray-900">₹{tx.totalCharged}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Security deposit held</span>
                    <span className="font-semibold text-violet-600">₹{tx.securityDeposit}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold p-3 rounded-xl ${tx.depositRefund > 0 ? "bg-lime-50" : "bg-red-50"}`}>
                    <span className={tx.depositRefund > 0 ? "text-lime-700" : "text-red-600"}>Deposit refund</span>
                    <span className={tx.depositRefund > 0 ? "text-lime-700" : "text-red-600"}>₹{tx.depositRefund}</span>
                  </div>
                </div>
                {tx.inspectionChecklist && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Inspection summary</p>
                    <p className="text-xs text-gray-500">
                      {(tx.inspectionChecklist as any[]).filter((c) => c.checked).length}/{(tx.inspectionChecklist as any[]).length} checks passed · Returned as: <span className="font-medium">{tx.resourceConditionAfter ?? "Pending"}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dispute */}
            {activePanel === "dispute" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-900 text-lg">Dispute Centre</h3>
                </div>
                {dispute ? (
                  <div className="space-y-3">
                    <div className={`rounded-xl p-4 border ${dispute.status === "resolved" ? "bg-lime-50 border-lime-200" : "bg-amber-50 border-amber-200"}`}>
                      <p className={`text-sm font-bold mb-1 ${dispute.status === "resolved" ? "text-lime-700" : "text-amber-700"}`}>
                        {dispute.status === "resolved" ? "Dispute Resolved" : "Under Review"}
                      </p>
                      <p className="text-xs text-gray-600">Reason: {dispute.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">{dispute.description}</p>
                      {dispute.resolution && (
                        <div className="mt-2 pt-2 border-t border-lime-200">
                          <p className="text-xs font-semibold text-lime-700">Resolution: <span className="font-normal text-lime-600">{dispute.resolution}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Raise a dispute if there's damage, loss, or other issue.</p>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Reason</label>
                      <select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                        <option value="">Select reason...</option>
                        <option>Item damaged</option><option>Item lost</option>
                        <option>Missing accessories</option><option>Late return</option>
                        <option>Condition misrepresented</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
                      <textarea value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} rows={3}
                        placeholder="Describe the issue in detail..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    </div>
                    <button onClick={raiseDispute} disabled={submitting}
                      className="w-full bg-amber-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Raise Dispute
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rating */}
            {activePanel === "rating" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Rate This Exchange</h3>
                {ratings.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Ratings submitted:</p>
                    {ratings.map((r: any) => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{r.from_user_name}</p>
                          <div className="flex">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />)}</div>
                        </div>
                        <p className="text-xs text-gray-600">"{r.review}"</p>
                      </div>
                    ))}
                  </div>
                )}
                {!ratings.find((r: any) => r.from_user_id === user?.id) && (tx.status === "settlement" || tx.status === "rated") && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Rate your experience with {isOwner ? tx.borrowerName : tx.ownerName}</p>
                    <div className="flex gap-2 justify-center">
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} onClick={() => setRatingVal(s)}
                          className={`w-12 h-12 rounded-xl transition-all text-2xl ${s <= ratingVal ? "bg-yellow-100 scale-110" : "bg-gray-100"}`}>⭐</button>
                      ))}
                    </div>
                    <p className="text-center text-sm font-bold text-gray-700">{ratingVal}/5</p>
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
                      placeholder="Write a short review..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <button onClick={submitRating} disabled={submitting}
                      className="w-full bg-lime-400 text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-lime-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Rating
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Summary + Actions */}
          <div className="col-span-2 space-y-4 sticky top-8 self-start">
            <ExchangeSummaryCard exchange={tx} viewAs={viewAs} />
            {renderActions() && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</p>
                {renderActions()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
