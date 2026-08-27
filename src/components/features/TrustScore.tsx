interface TrustScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function TrustScore({ score, size = "md", showLabel = true }: TrustScoreProps) {
  const getColor = (s: number) => {
    if (s >= 90) return { stroke: "#84cc16", text: "text-lime-600", bg: "bg-lime-50" };
    if (s >= 75) return { stroke: "#3b82f6", text: "text-blue-600", bg: "bg-blue-50" };
    if (s >= 60) return { stroke: "#f59e0b", text: "text-yellow-600", bg: "bg-yellow-50" };
    return { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" };
  };

  const sizeMap = { sm: 40, md: 56, lg: 72 };
  const { stroke, text, bg } = getColor(score);
  const dim = sizeMap[size];
  const r = (dim / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const labelSizeMap = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const scoreSizeMap = { sm: "text-xs font-bold", md: "text-sm font-bold", lg: "text-base font-bold" };

  return (
    <div className={`flex items-center gap-2 ${showLabel ? `rounded-xl px-3 py-2 ${bg}` : ""}`}>
      <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke={stroke} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="currentColor" fontSize={size === "lg" ? 14 : 11} fontWeight="700"
          style={{ transform: "rotate(90deg)", transformOrigin: `${dim / 2}px ${dim / 2}px` }}>
          {score}
        </text>
      </svg>
      {showLabel && (
        <div>
          <p className={`${scoreSizeMap[size]} ${text}`}>{score}/100</p>
          <p className="text-xs text-gray-500">Trust Score</p>
        </div>
      )}
    </div>
  );
}
