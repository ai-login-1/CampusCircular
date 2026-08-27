import { supabase } from "@/lib/supabase";
import { Resource, ResourceCategory } from "@/types";

function mapRow(row: any, ownerProfile?: any): Resource {
  return {
    id: row.id,
    title: row.title,
    category: row.category as ResourceCategory,
    description: row.description ?? "",
    images: row.images ?? [],
    ownerId: row.owner_id,
    ownerName: ownerProfile?.full_name ?? ownerProfile?.username ?? row.owner_id,
    ownerAvatar: ownerProfile?.avatar_url ?? "",
    ownerTrustScore: ownerProfile?.trust_score ?? 75,
    ownerVerified: ownerProfile?.is_verified ?? false,
    condition: row.condition as "Excellent" | "Good" | "Fair",
    isAvailable: row.is_available,
    availableFrom: row.available_from,
    distanceKm: Number(row.distance_km),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : undefined,
    dailyRate: Number(row.daily_rate),
    securityDeposit: Number(row.security_deposit),
    accessories: row.accessories ?? [],
    borrowingConditions: row.borrowing_conditions ?? [],
    tags: row.tags ?? [],
    matchScore: row.match_score,
    usageHistory: [],
    // Extra fields for admin
    status: row.status,
    flagReason: row.flag_reason,
    createdAt: row.created_at,
  } as Resource & { status: string; flagReason?: string; createdAt: string };
}

export const resourceStore = {
  async getApproved(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from("resources")
      .select(`*, user_profiles!resources_owner_id_fkey(full_name, username, avatar_url, trust_score, is_verified)`)
      .eq("status", "approved")
      .order("match_score", { ascending: false });
    if (error) {
      console.error("resourceStore.getApproved error:", error);
      return [];
    }
    return (data ?? []).map((row) => mapRow(row, row.user_profiles));
  },

  async getAll(): Promise<(Resource & { status: string; flagReason?: string })[]> {
    const { data, error } = await supabase
      .from("resources")
      .select(`*, user_profiles!resources_owner_id_fkey(full_name, username, avatar_url, trust_score, is_verified)`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("resourceStore.getAll error:", error);
      return [];
    }
    return (data ?? []).map((row) => mapRow(row, row.user_profiles)) as any[];
  },

  async getById(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from("resources")
      .select(`*, user_profiles!resources_owner_id_fkey(full_name, username, avatar_url, trust_score, is_verified)`)
      .eq("id", id)
      .single();
    if (error) return null;
    return mapRow(data, data.user_profiles);
  },

  async getByOwner(ownerId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from("resources")
      .select(`*, user_profiles!resources_owner_id_fkey(full_name, username, avatar_url, trust_score, is_verified)`)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => mapRow(row, row.user_profiles));
  },

  async updateStatus(id: string, status: string, flagReason?: string): Promise<void> {
    await supabase
      .from("resources")
      .update({ status, flag_reason: flagReason ?? null, updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  async updateAvailability(id: string, isAvailable: boolean): Promise<void> {
    await supabase
      .from("resources")
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq("id", id);
  },
};
