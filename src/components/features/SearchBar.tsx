import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  size?: "default" | "hero";
  value?: string;
  onChange?: (v: string) => void;
}

export default function SearchBar({ placeholder, onSearch, size = "default", value, onChange }: SearchBarProps) {
  const [internal, setInternal] = useState("");
  const current = value ?? internal;
  const setCurrent = onChange ?? setInternal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(current);
  };

  if (size === "hero") {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder={placeholder ?? "What do you need today?"}
          className="w-full pl-14 pr-32 py-4 text-base rounded-2xl border border-gray-200 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder={placeholder ?? "Search resources..."}
        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
      />
    </form>
  );
}
