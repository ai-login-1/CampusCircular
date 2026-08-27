import { AISearchResult, ParsedNeed } from "@/types";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, ShieldCheck } from "lucide-react";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";

interface AIResultCardProps {
  result: AISearchResult;
  rank: number;
}

export default function AIResultCard({ result, rank }: AIResultCardProps) {
  const navigate = useNavigate();
  const matchColor = result.aiMatchScore >= 80 ? "text-lime-600 bg-lime-50 border-lime-200"
    : result.aiMatchScore >= 60 ? "text-violet-600 bg-violet-50 border-violet-200"
    : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div
      onClick={() => navigate(`/resources/${result.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-0.5 group flex gap-0"
    >
      <div className="relative w-28 flex-shrink-0">
        <img src={result.images[0]} alt={result.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {rank <= 3 && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black flex items-center justify-center">
            {rank}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">{result.title}</h3>
          <div className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg border ${matchColor}`}>
            {result.aiMatchScore}%
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={result.isAvailable ? "available" : "unavailable"} />
          <span className="text-xs text-gray-400">{result.distanceKm} km</span>
          <span className="text-gray-200">·</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium
            ${result.condition === "Excellent" ? "text-lime-600" : result.condition === "Good" ? "text-blue-600" : "text-yellow-600"}`}>
            {result.condition}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {result.matchReasons.slice(0, 2).map((reason) => (
            <span key={reason} className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{reason}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5">
            <UserAvatar src={result.ownerAvatar} name={result.ownerName} size="sm" isVerified={result.ownerVerified} />
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{result.rating}</span>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-900">₹{result.dailyRate}<span className="text-xs font-normal text-gray-400">/day</span></p>
        </div>
      </div>
    </div>
  );
}
