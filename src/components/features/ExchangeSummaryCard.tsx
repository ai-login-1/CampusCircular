import { Exchange } from "@/lib/exchangeStore";
import { ShieldCheck } from "lucide-react";
import UserAvatar from "./UserAvatar";
import TrustScore from "./TrustScore";

interface ExchangeSummaryCardProps {
  exchange: Exchange;
  viewAs: "borrower" | "owner";
}

export default function ExchangeSummaryCard({ exchange: tx, viewAs }: ExchangeSummaryCardProps) {
  const peer = viewAs === "borrower"
    ? { name: tx.ownerName, avatar: tx.ownerAvatar, trustScore: tx.ownerTrustScore, role: "Owner" }
    : { name: tx.borrowerName, avatar: tx.borrowerAvatar, trustScore: tx.borrowerTrustScore, role: "Borrower" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Resource */}
      <div className="flex gap-4 items-start">
        <img src={tx.resourceImage} alt={tx.resourceTitle} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">{tx.resourceCategory}</span>
          <h3 className="font-bold text-gray-900 text-sm mt-1 leading-tight">{tx.resourceTitle}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
              tx.resourceConditionBefore === "Excellent" ? "bg-lime-50 text-lime-700"
              : tx.resourceConditionBefore === "Good" ? "bg-blue-50 text-blue-700"
              : "bg-yellow-50 text-yellow-700"}`}>
              {tx.resourceConditionBefore}
            </span>
          </div>
        </div>
      </div>

      {/* Peer info */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
        <UserAvatar src={peer.avatar} name={peer.name} size="md" isVerified />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{peer.name}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span>Campus Verified · {peer.role}</span>
          </div>
        </div>
        <TrustScore score={peer.trustScore} size="sm" showLabel={false} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-400 font-medium mb-0.5">Borrow From</p>
          <p className="font-semibold text-gray-800">{new Date(tx.requestedFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-400 font-medium mb-0.5">Return By</p>
          <p className="font-semibold text-gray-800">{new Date(tx.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      </div>

      {/* Purpose */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-400 font-medium mb-1">Purpose</p>
        <p className="text-sm text-gray-700 italic">"{tx.purpose}"</p>
      </div>

      {/* Fee breakdown — crystal clear */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Transaction Breakdown</p>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Borrowing charge</span>
          <span className="font-medium text-gray-700">₹{tx.dailyRate}/day × {tx.days}d</span>
        </div>
        <div className="flex justify-between text-xs pl-3">
          <span className="text-gray-400">= Borrowing fee</span>
          <span className="font-semibold text-gray-800">₹{tx.borrowingFee}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">+ Platform fee ({(tx.platformFeeRate * 100).toFixed(0)}%)</span>
          <span className="font-medium text-gray-700">₹{tx.platformFee}</span>
        </div>
        {tx.lateFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-red-500">+ Late fee</span>
            <span className="font-medium text-red-600">₹{tx.lateFee}</span>
          </div>
        )}
        {tx.damageFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-red-500">+ Damage fee</span>
            <span className="font-medium text-red-600">₹{tx.damageFee}</span>
          </div>
        )}
        <div className="bg-gray-900 rounded-xl px-3 py-2.5 flex justify-between items-center mt-1">
          <span className="text-white text-xs font-medium">= Transaction Amount</span>
          <span className="text-white font-bold">₹{tx.totalCharged}</span>
        </div>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-gray-500">Security deposit</span>
          <span className="font-medium text-violet-600">₹{tx.securityDeposit} (refundable)</span>
        </div>
        {tx.depositRefund < tx.securityDeposit && (
          <div className="flex justify-between text-xs">
            <span className="text-lime-600">Deposit refund</span>
            <span className="font-medium text-lime-600">₹{tx.depositRefund}</span>
          </div>
        )}
      </div>
    </div>
  );
}
