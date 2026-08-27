import { Resource, ParsedNeed, AISearchResult, ResourceCategory } from "@/types";

const KEYWORD_MAP: Record<string, { items: string[]; categories: ResourceCategory[] }> = {
  reel: { items: ["Camera", "Tripod", "Microphone", "Ring Light"], categories: ["Cameras", "Electronics"] },
  photo: { items: ["Camera", "Tripod", "SD Card"], categories: ["Cameras"] },
  photography: { items: ["Camera", "Lens", "Camera Bag"], categories: ["Cameras"] },
  video: { items: ["Camera", "Microphone", "Tripod", "Lighting"], categories: ["Cameras", "Electronics"] },
  podcast: { items: ["Microphone", "Pop Filter", "Headphones"], categories: ["Electronics"] },
  music: { items: ["Instrument", "Microphone", "Speaker"], categories: ["Music", "Electronics"] },
  concert: { items: ["PA System", "Microphone", "Lighting"], categories: ["Music", "Event Equipment"] },
  presentation: { items: ["Projector", "Screen", "Laptop", "Clicker"], categories: ["Event Equipment", "Electronics"] },
  seminar: { items: ["Projector", "Screen", "Microphone"], categories: ["Event Equipment", "Electronics"] },
  workshop: { items: ["Projector", "Whiteboard", "Laptop"], categories: ["Event Equipment", "Electronics"] },
  hackathon: { items: ["Laptop", "Extension Cord", "Headphones"], categories: ["Electronics"] },
  coding: { items: ["Laptop", "External Monitor"], categories: ["Electronics"] },
  event: { items: ["Camera", "Microphone", "Lighting", "Speaker"], categories: ["Cameras", "Event Equipment"] },
  festival: { items: ["Camera", "Microphone", "Lighting", "Tripod"], categories: ["Cameras", "Event Equipment"] },
  cricket: { items: ["Bat", "Pads", "Helmet", "Gloves", "Stumps"], categories: ["Sports"] },
  sports: { items: ["Sports Kit", "Equipment"], categories: ["Sports"] },
  piano: { items: ["Piano", "Sustain Pedal", "Stand"], categories: ["Music"] },
  guitar: { items: ["Guitar", "Amp", "Tuner"], categories: ["Music"] },
  study: { items: ["Textbook", "Reference Book"], categories: ["Books"] },
  exam: { items: ["Textbook", "Study Guide", "Previous Papers"], categories: ["Books"] },
  drone: { items: ["Drone", "Extra Batteries", "ND Filters"], categories: ["Cameras"] },
  aerial: { items: ["Drone", "Controller", "Batteries"], categories: ["Cameras"] },
  recording: { items: ["Microphone", "Audio Interface", "Headphones"], categories: ["Electronics", "Music"] },
};

const DEADLINE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /tomorrow/i, label: "Tomorrow" },
  { pattern: /tonight/i, label: "Tonight" },
  { pattern: /this\s+week/i, label: "This week" },
  { pattern: /this\s+weekend/i, label: "This weekend" },
  { pattern: /next\s+week/i, label: "Next week" },
  { pattern: /in\s+(\d+)\s+days?/i, label: "In a few days" },
  { pattern: /urgent/i, label: "Urgent" },
  { pattern: /asap/i, label: "ASAP" },
];

export function parseNaturalLanguageQuery(query: string): ParsedNeed {
  const lower = query.toLowerCase();
  const items: string[] = [];
  const categories: Set<ResourceCategory> = new Set();

  for (const [keyword, mapping] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      mapping.items.forEach((i) => { if (!items.includes(i)) items.push(i); });
      mapping.categories.forEach((c) => categories.add(c));
    }
  }

  let deadline = "";
  for (const { pattern, label } of DEADLINE_PATTERNS) {
    if (pattern.test(lower)) { deadline = label; break; }
  }
  if (!deadline) deadline = "Flexible";

  const contextMatches: string[] = [];
  if (lower.includes("club")) contextMatches.push("club event");
  if (lower.includes("fest") || lower.includes("festival")) contextMatches.push("college festival");
  if (lower.includes("project")) contextMatches.push("academic project");
  if (lower.includes("competition")) contextMatches.push("competition");
  if (lower.includes("placement")) contextMatches.push("placement prep");
  const context = contextMatches.join(", ") || "personal use";

  if (items.length === 0) {
    const words = query.split(/\s+/);
    words.forEach((w) => {
      const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (clean.length > 3 && !["need","want","have","some","that","this","with","from","for","and"].includes(clean)) {
        const cap = clean[0].toUpperCase() + clean.slice(1);
        if (!items.includes(cap)) items.push(cap);
      }
    });
  }

  return { items: items.slice(0, 6), deadline, context, categories: Array.from(categories) };
}

function computeMatchScore(resource: Resource, need: ParsedNeed): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const availScore = resource.isAvailable ? 30 : 0;
  score += availScore;
  if (resource.isAvailable) reasons.push("Available now");

  let catScore = 0;
  if (need.categories.length > 0 && need.categories.includes(resource.category)) {
    catScore = 25;
    reasons.push(`Matches category: ${resource.category}`);
  } else if (need.categories.length === 0) {
    catScore = 15;
  }
  score += catScore;

  const queryLower = need.items.map((i) => i.toLowerCase()).join(" ");
  const tagMatch = resource.tags.some((t) => queryLower.includes(t) || t.split(" ").some((w) => queryLower.includes(w)));
  const titleMatch = need.items.some((item) => resource.title.toLowerCase().includes(item.toLowerCase()));
  if (tagMatch || titleMatch) { score += 10; reasons.push("Strong title/tag match"); }

  let distScore = 0;
  if (resource.distanceKm <= 0.2) distScore = 15;
  else if (resource.distanceKm <= 0.5) distScore = 12;
  else if (resource.distanceKm <= 1.0) distScore = 8;
  else distScore = 4;
  score += distScore;
  if (resource.distanceKm <= 0.5) reasons.push("Very close to you");

  const condScore = resource.condition === "Excellent" ? 10 : resource.condition === "Good" ? 7 : 4;
  score += condScore;
  if (resource.condition === "Excellent") reasons.push("Excellent condition");

  const trustScore = resource.ownerTrustScore >= 90 ? 10 : resource.ownerTrustScore >= 75 ? 7 : 4;
  score += trustScore;
  if (resource.ownerTrustScore >= 90) reasons.push("High trust owner");

  const ratingScore = resource.rating >= 4.8 ? 5 : resource.rating >= 4.5 ? 4 : resource.rating >= 4.0 ? 3 : 2;
  score += ratingScore;

  const priceScore = resource.dailyRate <= 200 ? 5 : resource.dailyRate <= 400 ? 3 : 1;
  score += priceScore;
  if (resource.dailyRate <= 200) reasons.push("Great value");

  return { score: Math.min(100, Math.round(score)), reasons };
}

export function computeAIResults(query: string, resources: Resource[]): AISearchResult[] {
  const need = parseNaturalLanguageQuery(query);
  return resources
    .map((resource) => {
      const { score, reasons } = computeMatchScore(resource, need);
      return { ...resource, aiMatchScore: score, matchReasons: reasons };
    })
    .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
    .filter((r) => r.aiMatchScore >= 20);
}

// Legacy export for backward compatibility — uses empty array; callers should pass resources directly
export function getAIRecommendations(query: string, resources: Resource[] = []): { need: ParsedNeed; results: AISearchResult[] } {
  const need = parseNaturalLanguageQuery(query);
  const results = computeAIResults(query, resources);
  return { need, results };
}
