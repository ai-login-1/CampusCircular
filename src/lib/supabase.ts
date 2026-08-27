import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          department: string | null;
          year: string | null;
          is_verified: boolean;
          trust_score: number;
          rating: number;
          successful_exchanges: number;
          late_returns: number;
          disputes: number;
          role: "student" | "admin";
          status: "active" | "suspended" | "flagged";
          flag_reason: string | null;
          created_at: string;
        };
      };
      resources: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          category: string;
          description: string | null;
          images: string[];
          condition: "Excellent" | "Good" | "Fair";
          is_available: boolean;
          available_from: string | null;
          distance_km: number;
          rating: number;
          review_count: number;
          hourly_rate: number | null;
          daily_rate: number;
          security_deposit: number;
          accessories: string[];
          borrowing_conditions: string[];
          tags: string[];
          match_score: number;
          status: "pending_approval" | "approved" | "rejected" | "flagged" | "suspended";
          flag_reason: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      exchanges: {
        Row: {
          id: string;
          resource_id: string;
          resource_title: string;
          resource_image: string | null;
          resource_category: string;
          resource_condition_before: "Excellent" | "Good" | "Fair" | null;
          resource_condition_after: "Excellent" | "Good" | "Fair" | null;
          borrower_id: string;
          borrower_name: string;
          borrower_avatar: string | null;
          borrower_trust_score: number;
          owner_id: string;
          owner_name: string;
          owner_avatar: string | null;
          owner_trust_score: number;
          requested_from: string;
          requested_to: string;
          purpose: string | null;
          days: number;
          daily_rate: number;
          platform_fee_rate: number;
          security_deposit: number;
          borrowing_fee: number;
          platform_fee: number;
          late_fee: number;
          damage_fee: number;
          deposit_refund: number;
          total_charged: number;
          status: string;
          status_history: any[];
          inspection_checklist: any[] | null;
          created_at: string;
          updated_at: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          exchange_id: string;
          raised_by_id: string;
          raised_by_name: string;
          reason: string;
          description: string | null;
          evidence_labels: string[];
          status: "open" | "under_review" | "resolved";
          resolution: string | null;
          damage_fee_applied: number;
          resolved_by_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          exchange_id: string;
          from_user_id: string;
          from_user_name: string;
          to_user_id: string;
          to_user_name: string;
          rating: number;
          review: string | null;
          role: "borrower_to_owner" | "owner_to_borrower";
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: "info" | "success" | "warning" | "error" | "request" | "exchange";
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
      };
      platform_settings: {
        Row: {
          key: string;
          value: string;
          label: string | null;
          updated_at: string;
        };
      };
    };
  };
};
