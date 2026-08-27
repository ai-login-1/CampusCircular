import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Resource } from "@/types";
import StatusBadge from "./StatusBadge";
import MatchScore from "./MatchScore";
import UserAvatar from "./UserAvatar";

interface ResourceCardProps {
  resource: Resource;
  showMatch?: boolean;
}

export default function ResourceCard({ resource, showMatch = false }: ResourceCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/resources/${resource.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden hover:translate-y-[-2px] group"
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={resource.images[0]}
          alt={resource.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={resource.isAvailable ? "available" : "unavailable"} />
        </div>
        {showMatch && resource.matchScore && (
          <div className="absolute top-3 right-3">
            <MatchScore score={resource.matchScore} />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
            {resource.title}
          </h3>
          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap">
            {resource.category}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold text-gray-700">{resource.rating}</span>
          <span className="text-xs text-gray-400">({resource.reviewCount})</span>
          <span className="text-gray-300 mx-1">·</span>
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">{resource.distanceKm} km</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserAvatar src={resource.ownerAvatar} name={resource.ownerName} size="sm" isVerified={resource.ownerVerified} />
            <span className="text-xs text-gray-500">{resource.ownerName.split(" ")[0]}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">₹{resource.dailyRate}<span className="text-xs font-normal text-gray-400">/day</span></p>
            <p className="text-[10px] text-gray-400">+₹{resource.securityDeposit} deposit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
