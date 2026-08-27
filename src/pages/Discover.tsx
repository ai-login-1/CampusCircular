import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/features/SearchBar";
import FilterBar from "@/components/features/FilterBar";
import ResourceCard from "@/components/features/ResourceCard";
import EmptyState from "@/components/features/EmptyState";
import { resourceStore } from "@/lib/resourceStore";
import { Resource, ResourceCategory } from "@/types";

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") as ResourceCategory | null;
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | null>(initialCat);
  const [availability, setAvailability] = useState<"all" | "available">("all");
  const [sortBy, setSortBy] = useState("match");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourceStore.getApproved().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let results = [...resources];
    if (activeCategory) results = results.filter((r) => r.category === activeCategory);
    if (availability === "available") results = results.filter((r) => r.isAvailable);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some((t) => t.includes(q))
      );
    }
    switch (sortBy) {
      case "rating": results.sort((a, b) => b.rating - a.rating); break;
      case "distance": results.sort((a, b) => a.distanceKm - b.distanceKm); break;
      case "price_low": results.sort((a, b) => a.dailyRate - b.dailyRate); break;
      case "price_high": results.sort((a, b) => b.dailyRate - a.dailyRate); break;
      default: results.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return results;
  }, [resources, activeCategory, availability, query, sortBy]);

  const handleSearch = (q: string) => { setQuery(q); setSearchParams({ q }); };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">Discover Resources</h1>
            <p className="text-gray-500 text-sm">
              {loading ? "Loading..." : `${filtered.length} resource${filtered.length !== 1 ? "s" : ""} available on campus`}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} placeholder="Search cameras, laptops, textbooks..." />
        </div>
        <div className="mb-6">
          <FilterBar activeCategory={activeCategory} onCategoryChange={setActiveCategory}
            availability={availability} onAvailabilityChange={setAvailability}
            sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-56 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="No resources found"
            description="Try adjusting your filters or search for something else."
            actionLabel="Clear Filters" onAction={() => { setQuery(""); setActiveCategory(null); setAvailability("all"); }} />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">{filtered.length} results</span>
              {activeCategory && (
                <button onClick={() => setActiveCategory(null)}
                  className="bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-violet-200 transition-colors">
                  {activeCategory} ×
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} showMatch />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
