"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.generated";

type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "email" | "phone" | "full_name" | "role" | "is_active" | "phone_verified_at" | "requires_account_completion">;

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  role: Profile["role"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("email, phone, full_name, role, is_active, phone_verified_at, requires_account_completion")
      .eq("id", nextUser.id)
      .maybeSingle();
    setProfile(data ?? null);
    setIsLoading(false);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user);
  }, [loadProfile, supabase]);

  useEffect(() => {
    void refreshProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void loadProfile(session?.user ?? null), 0);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile, refreshProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    refreshProfile,
    signOut,
  }), [isLoading, profile, refreshProfile, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
