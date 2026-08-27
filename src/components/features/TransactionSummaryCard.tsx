import { Transaction } from "@/types";
import { ShieldCheck, Star } from "lucide-react";
import UserAvatar from "./UserAvatar";
import TrustScore from "./TrustScore";

interface TransactionSummaryCardProps {
  transaction: Transaction;
  viewAs: "borrower" | "owner";
}

export default function TransactionSummaryCard({ transaction, viewAs }: TransactionSummaryCardProps) {
  const peer = viewAs === "borrower"
    ? { name: transaction.ownerName, avatar: transaction.ownerAvatar, trustScore: transaction.ownerTrustScore, role: "Owner" }
    : { name: transaction.borrowerName, avatar: transaction.borrowerAvatar, trustScore: transaction.borrowerTrustScore, role: "Borrower" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Resource */}
      <div className="flex gap-4 items-start">
        <img src={transaction.resourceImage} alt={transaction.resourceTitle}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">
            {transaction.resourceCategory}
          </span>
          <h3 className="font-bold text-gray-900 text-sm mt-1 leading-tight">{transaction.resourceTitle}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium
              ${transaction.resourceConditionBefore === "Excellent" ? "bg-lime-50 text-lime-700"
              : transaction.resourceConditionBefore === "Good" ? "bg-blue-50 text-blue-700"
              : "bg-yellow-50 text-yellow-700"}`}>
              {transaction.resourceConditionBefore}
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
          <p className="font-semibold text-gray-800">
            {new Date(transaction.requestedFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-400 font-medium mb-0.5">Return By</p>
          <p className="font-semibold text-gray-800">
            {new Date(transaction.requestedTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Purpose */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-400 font-medium mb-1">Purpose</p>
        <p className="text-sm text-gray-700 italic">"{transaction.purpose}"</p>
      </div>

      {/* Fee breakdown */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">₹{transaction.dailyRate}/day × {transaction.days} day{transaction.days > 1 ? "s" : ""}</span>
          <span className="font-medium text-gray-700">₹{transaction.borrowingFee}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Platform fee (5%)</span>
          <span className="font-medium text-gray-700">₹{transaction.platformFee}</span>
        </div>
        {transaction.lateFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-red-500">Late fee</span>
            <span className="font-medium text-red-600">₹{transaction.lateFee}</span>
          </div>
        )}
        {transaction.damageFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-red-500">Damage fee</span>
            <span className="font-medium text-red-600">₹{transaction.damageFee}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Security deposit</span>
          <span className="font-medium text-violet-600">₹{transaction.securityDeposit} (refundable)</span>
        </div>
        <div className="bg-gray-900 rounded-xl px-3 py-2.5 flex justify-between items-center">
          <span className="text-white text-xs font-medium">Total to pay</span>
          <span className="text-white font-bold">₹{transaction.borrowingFee + transaction.platformFee + transaction.securityDeposit}</span>
        </div>
      </div>
    </div>
  );
}
