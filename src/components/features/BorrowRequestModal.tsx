import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Calendar, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { Resource } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { exchangeStore } from "@/lib/exchangeStore";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import TrustScore from "./TrustScore";

interface BorrowRequestModalProps {
  resource: Resource;
  days: number;
  onClose: () => void;
}

export default function BorrowRequestModal({ resource, days, onClose }: BorrowRequestModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState("");
  const [fromDate, setFromDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [numDays, setNumDays] = useState(days);
  const [submitting, setSubmitting] = useState(false);

  const toDate = new Date(new Date(fromDate).getTime() + (numDays - 1) * 86400000).toISOString().split("T")[0];
  const borrowingFee = resource.dailyRate * numDays;
  const platformFee = Math.round(borrowingFee * 0.05);
  const total = borrowingFee + platformFee + resource.securityDeposit;

  const handleSubmit = async () => {
    if (!purpose.trim()) { toast.error("Please describe your purpose."); return; }
    if (!user) { toast.error("Please log in."); return; }
    setSubmitting(true);
    try {
      const ex = await exchangeStore.create({
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceImage: resource.images[0],
        resourceCategory: resource.category,
        resourceConditionBefore: resource.condition,
        borrowerId: user.id,
        borrowerName: user.name,
        borrowerAvatar: user.avatar,
        borrowerTrustScore: user.trustScore,
        ownerId: resource.ownerId,
        ownerName: resource.ownerName,
        ownerAvatar: resource.ownerAvatar,
        ownerTrustScore: resource.ownerTrustScore,
        requestedFrom: fromDate,
        requestedTo: toDate,
        purpose: purpose.trim(),
        days: numDays,
        dailyRate: resource.dailyRate,
        platformFeeRate: 0.05,
        securityDeposit: resource.securityDeposit,
        borrowingFee,
        platformFee,
        lateFee: 0,
        damageFee: 0,
        depositRefund: resource.securityDeposit,
        totalCharged: borrowingFee + platformFee,
        status: "requested",
        statusHistory: [],
      });
      toast.success(`Request sent to ${resource.ownerName}!`);
      onClose();
      navigate(`/exchanges/${ex.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send request");
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Request to Borrow</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Resource preview */}
          <div className="flex gap-4 items-start bg-gray-50 rounded-2xl p-4">
            <img src={resource.images[0]} alt={resource.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight">{resource.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${resource.condition === "Excellent" ? "bg-lime-100 text-lime-700" : resource.condition === "Good" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {resource.condition}
                </span>
                <span className="text-xs text-gray-400">{resource.distanceKm} km away</span>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner</p>
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-3">
              <UserAvatar src={resource.ownerAvatar} name={resource.ownerName} size="md" isVerified={resource.ownerVerified} />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{resource.ownerName}</p>
                <div className="flex items-center gap-1 text-xs text-blue-600"><ShieldCheck className="w-3 h-3" /> Campus Verified</div>
              </div>
              <TrustScore score={resource.ownerTrustScore} size="sm" showLabel={false} />
            </div>
          </div>

          {/* Dates */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Days</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setNumDays(Math.max(1, numDays - 1))} className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center">−</button>
                  <span className="text-lg font-black text-gray-900 w-6 text-center">{numDays}</span>
                  <button onClick={() => setNumDays(numDays + 1)} className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Return by: {new Date(toDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1 block">
              <MessageSquare className="w-3 h-3" /> Your Purpose
            </label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3}
              placeholder="Brief description of why you need this resource..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Transaction Summary</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Borrowing charge (₹{resource.dailyRate}/day × {numDays}d)</span>
              <span className="font-medium">₹{borrowingFee}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">+ Platform fee (5%)</span>
              <span className="font-medium">₹{platformFee}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-bold">
              <span className="text-gray-800">= Transaction amount</span>
              <span className="text-gray-900">₹{borrowingFee + platformFee}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Security deposit (refundable)</span>
              <span className="font-medium text-violet-600">₹{resource.securityDeposit}</span>
            </div>
            <div className="bg-gray-900 rounded-xl px-3 py-2.5 flex justify-between items-center mt-1">
              <span className="text-white text-xs font-medium">Total to pay on acceptance</span>
              <span className="text-white font-bold text-sm">₹{total}</span>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Borrow Request
          </button>
          <p className="text-[11px] text-gray-400 text-center">No payment until request is accepted by owner.</p>
        </div>
      </div>
    </div>
  );
}
