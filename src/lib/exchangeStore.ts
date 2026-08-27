import { supabase } from "@/lib/supabase";

export type ExchangeStatus =
  | "requested" | "accepted" | "rejected" | "cancelled"
  | "handover" | "borrowed" | "overdue" | "return_due"
  | "returned" | "inspection" | "disputed" | "resolved"
  | "settlement" | "rated";

export interface Exchange {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceImage: string;
  resourceCategory: string;
  resourceConditionBefore: "Excellent" | "Good" | "Fair";
  resourceConditionAfter?: "Excellent" | "Good" | "Fair";
  borrowerId: string;
  borrowerName: string;
  borrowerAvatar: string;
  borrowerTrustScore: number;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerTrustScore: number;
  requestedFrom: string;
  requestedTo: string;
  purpose: string;
  days: number;
  dailyRate: number;
  platformFeeRate: number;
  securityDeposit: number;
  borrowingFee: number;
  platformFee: number;
  lateFee: number;
  damageFee: number;
  depositRefund: number;
  totalCharged: number;
  status: ExchangeStatus;
  statusHistory: { status: ExchangeStatus; timestamp: string; note?: string }[];
  inspectionChecklist?: { label: string; checked: boolean }[];
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: any): Exchange {
  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    resourceImage: row.resource_image ?? "",
    resourceCategory: row.resource_category,
    resourceConditionBefore: row.resource_condition_before ?? "Good",
    resourceConditionAfter: row.resource_condition_after,
    borrowerId: row.borrower_id,
    borrowerName: row.borrower_name,
    borrowerAvatar: row.borrower_avatar ?? "",
    borrowerTrustScore: row.borrower_trust_score ?? 75,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar ?? "",
    ownerTrustScore: row.owner_trust_score ?? 75,
    requestedFrom: row.requested_from,
    requestedTo: row.requested_to,
    purpose: row.purpose ?? "",
    days: row.days,
    dailyRate: Number(row.daily_rate),
    platformFeeRate: Number(row.platform_fee_rate),
    securityDeposit: Number(row.security_deposit),
    borrowingFee: Number(row.borrowing_fee),
    platformFee: Number(row.platform_fee),
    lateFee: Number(row.late_fee),
    damageFee: Number(row.damage_fee),
    depositRefund: Number(row.deposit_refund),
    totalCharged: Number(row.total_charged),
    status: row.status as ExchangeStatus,
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
    inspectionChecklist: row.inspection_checklist,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const exchangeStore = {
  async getAll(): Promise<Exchange[]> {
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async getById(id: string): Promise<Exchange | null> {
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return mapRow(data);
  },

  async getForBorrower(userId: string): Promise<Exchange[]> {
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("borrower_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async getForOwner(userId: string): Promise<Exchange[]> {
    const { data, error } = await supabase
      .from("exchanges")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async create(ex: Omit<Exchange, "id" | "createdAt" | "updatedAt">): Promise<Exchange> {
    const { data, error } = await supabase
      .from("exchanges")
      .insert({
        resource_id: ex.resourceId,
        resource_title: ex.resourceTitle,
        resource_image: ex.resourceImage,
        resource_category: ex.resourceCategory,
        resource_condition_before: ex.resourceConditionBefore,
        borrower_id: ex.borrowerId,
        borrower_name: ex.borrowerName,
        borrower_avatar: ex.borrowerAvatar,
        borrower_trust_score: ex.borrowerTrustScore,
        owner_id: ex.ownerId,
        owner_name: ex.ownerName,
        owner_avatar: ex.ownerAvatar,
        owner_trust_score: ex.ownerTrustScore,
        requested_from: ex.requestedFrom,
        requested_to: ex.requestedTo,
        purpose: ex.purpose,
        days: ex.days,
        daily_rate: ex.dailyRate,
        platform_fee_rate: ex.platformFeeRate,
        security_deposit: ex.securityDeposit,
        borrowing_fee: ex.borrowingFee,
        platform_fee: ex.platformFee,
        late_fee: 0,
        damage_fee: 0,
        deposit_refund: ex.securityDeposit,
        total_charged: ex.borrowingFee + ex.platformFee,
        status: "requested",
        status_history: [{ status: "requested", timestamp: new Date().toISOString(), note: "Request submitted" }],
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async advance(id: string, newStatus: ExchangeStatus, note?: string): Promise<Exchange> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Exchange not found");
    const newHistory = [
      ...existing.statusHistory,
      { status: newStatus, timestamp: new Date().toISOString(), note },
    ];
    const { data, error } = await supabase
      .from("exchanges")
      .update({ status: newStatus, status_history: newHistory, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async updateInspection(
    id: string,
    checklist: { label: string; checked: boolean }[],
    conditionAfter: "Excellent" | "Good" | "Fair",
    damageFee: number,
    existing: Exchange
  ): Promise<Exchange> {
    const newHistory = [
      ...existing.statusHistory,
      { status: "settlement" as ExchangeStatus, timestamp: new Date().toISOString(), note: "Inspection completed" },
    ];
    const depositRefund = Math.max(0, existing.securityDeposit - damageFee);
    const totalCharged = existing.borrowingFee + existing.platformFee + existing.lateFee + damageFee;
    const { data, error } = await supabase
      .from("exchanges")
      .update({
        inspection_checklist: checklist,
        resource_condition_after: conditionAfter,
        damage_fee: damageFee,
        deposit_refund: depositRefund,
        total_charged: totalCharged,
        status: "settlement",
        status_history: newHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async raiseDispute(id: string, disputeData: {
    raisedById: string;
    raisedByName: string;
    reason: string;
    description: string;
    evidenceLabels: string[];
  }, existing: Exchange): Promise<Exchange> {
    const newHistory = [
      ...existing.statusHistory,
      { status: "disputed" as ExchangeStatus, timestamp: new Date().toISOString(), note: `Dispute: ${disputeData.reason}` },
    ];
    await supabase.from("disputes").insert({
      exchange_id: id,
      raised_by_id: disputeData.raisedById,
      raised_by_name: disputeData.raisedByName,
      reason: disputeData.reason,
      description: disputeData.description,
      evidence_labels: disputeData.evidenceLabels,
      status: "under_review",
    });
    const { data, error } = await supabase
      .from("exchanges")
      .update({ status: "disputed", status_history: newHistory, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async addRating(id: string, ratingData: {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    rating: number;
    review: string;
    role: "borrower_to_owner" | "owner_to_borrower";
  }, existing: Exchange): Promise<Exchange> {
    await supabase.from("ratings").insert({
      exchange_id: id,
      from_user_id: ratingData.fromUserId,
      from_user_name: ratingData.fromUserName,
      to_user_id: ratingData.toUserId,
      to_user_name: ratingData.toUserName,
      rating: ratingData.rating,
      review: ratingData.review,
      role: ratingData.role,
    });
    const { data: allRatings } = await supabase.from("ratings").select("id").eq("exchange_id", id);
    const isComplete = (allRatings?.length ?? 0) >= 2;
    const newStatus: ExchangeStatus = isComplete ? "rated" : existing.status;
    const newHistory = isComplete
      ? [...existing.statusHistory, { status: "rated" as ExchangeStatus, timestamp: new Date().toISOString(), note: "Both ratings submitted" }]
      : existing.statusHistory;
    const { data, error } = await supabase
      .from("exchanges")
      .update({ status: newStatus, status_history: newHistory, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },
};
