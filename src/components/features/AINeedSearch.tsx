import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowRight, Loader2 } from "lucide-react";
import { parseNaturalLanguageQuery, computeAIResults } from "@/lib/aiSearch";
import { ParsedNeed, AISearchResult, Resource } from "@/types";
import AIResultCard from "@/components/features/AIResultCard";
import { MOCK_RESOURCES } from "@/lib/mockData";

interface AINeedSearchProps {
  initialQuery?: string;
  onClose?: () => void;
  resources?: Resource[];
}

type SearchPhase = "idle" | "understanding" | "results";

export default function AINeedSearch({ initialQuery = "", onClose, resources }: AINeedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [phase, setPhase] = useState<SearchPhase>(initialQuery ? "understanding" : "idle");
  const [parsedNeed, setParsedNeed] = useState<ParsedNeed | null>(null);
  const [results, setResults] = useState<AISearchResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const liveResources = resources ?? MOCK_RESOURCES;

  useEffect(() => {
    if (initialQuery) triggerSearch(initialQuery);
  }, []);

  const triggerSearch = (q: string) => {
    if (!q.trim()) return;
    setPhase("understanding");
    setTimeout(() => {
      const need = parseNaturalLanguageQuery(q);
      const res = computeAIResults(q, liveResources);
      setParsedNeed(need);
      setResults(res);
      setPhase("results");
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); triggerSearch(query); };

  const handleReset = () => {
    setQuery(""); setParsedNeed(null); setResults([]); setPhase("idle");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const EXAMPLE_QUERIES = [
    "I need to make a reel for my club event tomorrow",
    "Looking for something to practice piano before cultural fest",
    "Need a projector for our workshop next week",
    "MacBook for a 3-day hackathon",
  ];

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="relative">
        <textarea ref={textareaRef} value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); triggerSearch(query); } }}
          placeholder="Describe what you need in natural language..." rows={2}
          className="w-full bg-white/10 text-white placeholder-gray-400 rounded-2xl px-5 py-4 pr-28 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-400/50 border border-white/10" />
        <div className="absolute right-3 bottom-3 flex gap-2">
          {query && (
            <button type="button" onClick={handleReset}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-gray-300" />
            </button>
          )}
          <button type="submit" disabled={!query.trim() || phase === "understanding"}
            className="h-9 px-4 rounded-xl bg-lime-400 text-gray-900 text-sm font-bold flex items-center gap-2 hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {phase === "understanding" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Find
          </button>
        </div>
      </form>

      {phase === "idle" && (
        <div className="mt-4 space-y-2">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Try asking for...</p>
          {EXAMPLE_QUERIES.map((eq) => (
            <button key={eq} onClick={() => { setQuery(eq); triggerSearch(eq); }}
              className="w-full text-left px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" /> {eq}
            </button>
          ))}
        </div>
      )}

      {phase === "understanding" && (
        <div className="mt-6 text-center">
          <Loader2 className="w-8 h-8 text-lime-400 animate-spin mx-auto mb-3" />
          <p className="text-white font-semibold text-sm">Understanding your need...</p>
          <p className="text-gray-400 text-xs mt-1">Matching resources across campus</p>
        </div>
      )}

      {phase === "results" && parsedNeed && (
        <div className="mt-5 flex-1 overflow-y-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <p className="text-lime-400 text-xs font-bold uppercase tracking-wide mb-2">Understood your need</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {parsedNeed.items.map((item) => (
                <span key={item} className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-lg font-medium">{item}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              <span>📅 {parsedNeed.deadline}</span>
              <span>📍 {parsedNeed.context}</span>
              {parsedNeed.categories.length > 0 && <span>🏷 {parsedNeed.categories.join(", ")}</span>}
            </div>
          </div>
          <p className="text-gray-300 text-xs font-medium mb-3">Found {results.length} matching resource{results.length !== 1 ? "s" : ""}</p>
          <div className="space-y-3">
            {results.slice(0, 6).map((result, i) => (
              <AIResultCard key={result.id} result={result} rank={i + 1} />
            ))}
          </div>
          {results.length > 6 && (
            <button className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-200 py-2">
              +{results.length - 6} more results — view in Discover
            </button>
          )}
        </div>
      )}
    </div>
  );
}
