// Types for the app — extends original with backend-aware fields
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  year: string;
  isVerified: boolean;
  trustScore: number;
  rating: number;
  successfulExchanges: number;
  lateReturns: number;
  disputes: number;
  role: "student" | "admin";
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerTrustScore: number;
  ownerVerified: boolean;
  condition: "Excellent" | "Good" | "Fair";
  isAvailable: boolean;
  availableFrom?: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  hourlyRate?: number;
  dailyRate: number;
  securityDeposit: number;
  accessories: string[];
  borrowingConditions: string[];
  matchScore?: number;
  tags: string[];
  usageHistory: UsageRecord[];
  // Admin fields
  status?: string;
  flagReason?: string;
  createdAt?: string;
}

export type ResourceCategory =
  | "Cameras"
  | "Electronics"
  | "Books"
  | "Sports"
  | "Music"
  | "Event Equipment";

export type TransactionStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "handover"
  | "borrowed"
  | "overdue"
  | "return_due"
  | "returned"
  | "inspection"
  | "disputed"
  | "resolved"
  | "settlement"
  | "rated";

export interface ConditionEvidence {
  label: string;
  imagePlaceholder: string;
  checked: boolean;
}

export interface DisputeRecord {
  raisedBy: string;
  reason: string;
  description: string;
  evidenceLabels: string[];
  status: "open" | "under_review" | "resolved";
  resolution?: string;
  createdAt: string;
}

export interface RatingRecord {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  rating: number;
  review: string;
  role: "borrower_to_owner" | "owner_to_borrower";
  createdAt: string;
}

export interface Transaction {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceImage: string;
  resourceCategory: ResourceCategory;
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
  status: TransactionStatus;
  statusHistory: { status: TransactionStatus; timestamp: string; note?: string }[];
  inspectionChecklist?: ConditionEvidence[];
  dispute?: DisputeRecord;
  ratings?: RatingRecord[];
  createdAt: string;
  updatedAt: string;
}

// Legacy types for backward compat
export interface Loan {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceImage: string;
  borrowerId: string;
  lenderId: string;
  lenderName: string;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "returned" | "overdue";
  dailyRate: number;
  deposit: number;
  totalCost: number;
}

export interface Request {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceImage: string;
  requesterId: string;
  ownerId: string;
  ownerName: string;
  requestedFrom: string;
  requestedTo: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface UsageRecord {
  userId: string;
  userName: string;
  date: string;
  rating: number;
  review: string;
}

export interface ParsedNeed {
  items: string[];
  deadline: string;
  context: string;
  categories: ResourceCategory[];
}

export interface AISearchResult extends Resource {
  aiMatchScore: number;
  matchReasons: string[];
}
