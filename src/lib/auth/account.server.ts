import "server-only";

import { cache } from "react";
import { getUserFullName, isPhoneReadyForAccess } from "@/lib/auth/client";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/permissions";

export type AccountContext = {
  userId: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  role: AppRole;
  isActive: boolean;
  phoneVerifiedAt: string | null;
  requiresAccountCompletion: boolean;
  isReady: boolean;
};

export const getCurrentAccountContext = cache(async (): Promise<AccountContext | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, phone, phone_verified_at, full_name, role, is_active, requires_account_completion")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  const phoneVerifiedAt = profile.phone_verified_at ?? user.phone_confirmed_at ?? null;
  const phone = profile.phone ?? user.phone ?? null;
  const fullName = getUserFullName(user, profile.full_name);
  const isReady = Boolean(
    profile.is_active
    && isPhoneReadyForAccess(profile.phone, profile.phone_verified_at, user.phone, user.phone_confirmed_at)
    && phone
    && phoneVerifiedAt
    && fullName
    && !profile.requires_account_completion,
  );

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? null,
    phone,
    fullName,
    role: profile.role,
    isActive: profile.is_active,
    phoneVerifiedAt,
    requiresAccountCompletion: profile.requires_account_completion,
    isReady,
  };
});
