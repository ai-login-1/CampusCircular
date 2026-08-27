import { ResourceCategory } from "@/types";

interface CategoryCardProps {
  category: ResourceCategory;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

const categoryConfig: Record<ResourceCategory, { emoji: string; bg: string; activeBg: string; border: string }> = {
  Cameras: { emoji: "📷", bg: "bg-violet-50", activeBg: "bg-violet-500", border: "border-violet-200" },
  Electronics: { emoji: "💻", bg: "bg-blue-50", activeBg: "bg-blue-500", border: "border-blue-200" },
  Books: { emoji: "📚", bg: "bg-yellow-50", activeBg: "bg-yellow-400", border: "border-yellow-200" },
  Sports: { emoji: "⚽", bg: "bg-lime-50", activeBg: "bg-lime-500", border: "border-lime-200" },
  Music: { emoji: "🎵", bg: "bg-orange-50", activeBg: "bg-orange-500", border: "border-orange-200" },
  "Event Equipment": { emoji: "🎤", bg: "bg-pink-50", activeBg: "bg-pink-500", border: "border-pink-200" },
};

export default function CategoryCard({ category, count, isActive, onClick }: CategoryCardProps) {
  const cfg = categoryConfig[category];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border transition-all duration-200 min-w-[96px] cursor-pointer hover:scale-105 active:scale-95
        ${isActive
          ? `${cfg.activeBg} border-transparent text-white shadow-md`
          : `${cfg.bg} ${cfg.border} text-gray-700 hover:shadow-sm`
        }`}
    >
      <span className="text-2xl">{cfg.emoji}</span>
      <span className={`text-xs font-semibold text-center leading-tight ${isActive ? "text-white" : "text-gray-700"}`}>
        {category}
      </span>
      {count !== undefined && (
        <span className={`text-[10px] font-medium ${isActive ? "text-white/80" : "text-gray-400"}`}>
          {count} items
        </span>
      )}
    </button>
  );
}
