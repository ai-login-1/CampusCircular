import { SlidersHorizontal } from "lucide-react";
import { ResourceCategory } from "@/types";
import CategoryCard from "./CategoryCard";

const CATEGORIES: ResourceCategory[] = ["Cameras", "Electronics", "Books", "Sports", "Music", "Event Equipment"];

interface FilterBarProps {
  activeCategory: ResourceCategory | null;
  onCategoryChange: (c: ResourceCategory | null) => void;
  availability: "all" | "available";
  onAvailabilityChange: (v: "all" | "available") => void;
  sortBy: string;
  onSortChange: (v: string) => void;
}

export default function FilterBar({
  activeCategory, onCategoryChange, availability, onAvailabilityChange, sortBy, onSortChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onCategoryChange(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
            ${!activeCategory ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            isActive={activeCategory === cat}
            onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "available"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onAvailabilityChange(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${availability === opt ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {opt === "all" ? "All Items" : "Available Now"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <option value="match">Best Match</option>
            <option value="rating">Highest Rated</option>
            <option value="distance">Nearest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
