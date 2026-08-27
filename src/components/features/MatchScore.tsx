interface MatchScoreProps {
  score: number;
}

export default function MatchScore({ score }: MatchScoreProps) {
  const getConfig = (s: number) => {
    if (s >= 90) return { label: "Perfect Match", className: "bg-lime-400 text-lime-950" };
    if (s >= 75) return { label: "Great Match", className: "bg-violet-400 text-violet-950" };
    if (s >= 60) return { label: "Good Match", className: "bg-yellow-300 text-yellow-900" };
    return { label: "Partial Match", className: "bg-gray-200 text-gray-700" };
  };

  const { label, className } = getConfig(score);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {score}% {label}
    </span>
  );
}
