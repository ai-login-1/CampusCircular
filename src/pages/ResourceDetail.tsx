import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import StatusBadge from "@/components/features/StatusBadge";
import TrustScore from "@/components/features/TrustScore";
import UserAvatar from "@/components/features/UserAvatar";
import PriceBreakdown from "@/components/features/PriceBreakdown";
import MatchScore from "@/components/features/MatchScore";
import BorrowRequestModal from "@/components/features/BorrowRequestModal";
import { resourceStore } from "@/lib/resourceStore";
import { Resource } from "@/types";
import { toast } from "sonner";

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [days, setDays] = useState(1);
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => {
    if (id) {
      resourceStore.getById(id).then((r) => {
        setResource(r);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </main>
    </div>
  );

  if (!resource) return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😔</p>
          <h2 className="text-xl font-bold text-gray-900">Resource not found</h2>
          <button onClick={() => navigate("/discover")} className="mt-4 text-violet-600 font-medium">Back to Discover</button>
        </div>
      </main>
    </div>
  );

  const getConditionColor = (c: string) => {
    if (c === "Excellent") return "bg-lime-100 text-lime-700";
    if (c === "Good") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to results
        </button>

        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-3 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative h-80 bg-gray-100">
                <img src={resource.images[imgIdx] ?? resource.images[0]} alt={resource.title}
                  className="w-full h-full object-cover" />
                {resource.images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx((i) => (i - 1 + resource.images.length) % resource.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setImgIdx((i) => (i + 1) % resource.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <StatusBadge status={resource.isAvailable ? "available" : "unavailable"} />
                  {resource.matchScore && <MatchScore score={resource.matchScore} />}
                </div>
              </div>
              {resource.images.length > 1 && (
                <div className="flex gap-2 p-4">
                  {resource.images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-violet-500" : "border-transparent"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">{resource.category}</span>
                  <h1 className="text-2xl font-black text-gray-900 mt-2 leading-tight">{resource.title}</h1>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 ${getConditionColor(resource.condition)}`}>
                  {resource.condition}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-gray-800">{resource.rating}</span>
                  <span className="text-gray-400">({resource.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{resource.distanceKm} km away</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{resource.description}</p>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <UserAvatar src={resource.ownerAvatar} name={resource.ownerName} size="lg" isVerified={resource.ownerVerified} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{resource.ownerName}</p>
                    {resource.ownerVerified && (
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Campus Community Member</p>
                </div>
                <TrustScore score={resource.ownerTrustScore} size="sm" showLabel={false} />
              </div>
            </div>

            {/* Accessories & Conditions */}
            <div className="grid grid-cols-2 gap-4">
              {resource.accessories.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">Included Accessories</h3>
                  <ul className="space-y-1.5">
                    {resource.accessories.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resource.borrowingConditions.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" /> Borrowing Conditions
                  </h3>
                  <ul className="space-y-1.5">
                    {resource.borrowingConditions.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Usage History */}
            {resource.usageHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Previous Usage</h3>
                <div className="space-y-4">
                  {resource.usageHistory.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                        {h.userName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-800">{h.userName}</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-3 h-3 ${j < h.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date(h.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                        </div>
                        <p className="text-xs text-gray-500">{h.review}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Panel */}
          <div className="col-span-2 space-y-4 sticky top-8 self-start">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Book this Resource</h3>
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Number of Days</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDays(Math.max(1, days - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-50">−</button>
                  <span className="text-xl font-black text-gray-900 w-6 text-center">{days}</span>
                  <button onClick={() => setDays(days + 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-50">+</button>
                </div>
              </div>
              <PriceBreakdown dailyRate={resource.dailyRate} hourlyRate={resource.hourlyRate}
                securityDeposit={resource.securityDeposit} days={days} />
              {!resource.isAvailable && resource.availableFrom && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  ⏰ Available from {new Date(resource.availableFrom).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                </div>
              )}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => resource.isAvailable ? setShowRequest(true) : toast.info("This resource is currently unavailable.")}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${resource.isAvailable
                    ? "bg-gray-900 text-white hover:bg-gray-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                  {resource.isAvailable ? "Request to Borrow" : "Currently Unavailable"}
                </button>
                <button onClick={() => navigate("/discover")}
                  className="w-full py-3 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                  Find Alternatives
                </button>
              </div>
            </div>
          </div>
        </div>

        {showRequest && (
          <BorrowRequestModal resource={resource} days={days} onClose={() => setShowRequest(false)} />
        )}
      </main>
    </div>
  );
}
