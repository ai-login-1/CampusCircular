import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
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
  status: string;
  studentId?: string;
  mobile?: string;
  firstLoginCompleted?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

function mapSupabaseUser(supabaseUser: User, profile: any): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: profile?.full_name ?? profile?.username ?? supabaseUser.email?.split("@")[0] ?? "User",
    username: profile?.username ?? supabaseUser.email?.split("@")[0] ?? "user",
    avatar: profile?.avatar_url ?? supabaseUser.user_metadata?.avatar_url ?? "",
    department: profile?.department ?? "General",
    year: profile?.year ?? "1st Year",
    isVerified: profile?.is_verified ?? false,
    trustScore: profile?.trust_score ?? 75,
    rating: profile?.rating ?? 5.0,
    successfulExchanges: profile?.successful_exchanges ?? 0,
    lateReturns: profile?.late_returns ?? 0,
    disputes: profile?.disputes ?? 0,
    role: profile?.role ?? "student",
    status: profile?.status ?? "active",
    studentId: profile?.student_id ?? undefined,
    mobile: profile?.mobile ?? undefined,
    firstLoginCompleted: profile?.first_login_completed ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (supabaseUser: User): Promise<AuthUser | null> => {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();
    if (!profile) return null;
    return mapSupabaseUser(supabaseUser, profile);
  };

  const refreshUser = async () => {
    const { data: { user: su } } = await supabase.auth.getUser();
    if (su) {
      const authUser = await fetchProfile(su);
      if (authUser) setUser(authUser);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety #1: restore existing session (handles page refresh + remember me)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted && authUser) setUser(authUser);
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted && authUser) setUser(authUser);
        if (mounted) setLoading(false);
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUser(null);
        if (mounted) setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        const authUser = await fetchProfile(session.user);
        if (mounted && authUser) setUser(authUser);
      } else if (event === "PASSWORD_RECOVERY") {
        // Session is set; let ResetPassword page handle it
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = (u: AuthUser) => setUser(u);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
