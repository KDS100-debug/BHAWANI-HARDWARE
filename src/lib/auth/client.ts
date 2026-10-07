import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

const staffRoles = new Set(["owner", "staff", "manager", "sales_staff", "accountant"]);

export function safeNextPath(value?: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function resolveSignedInDestination(
  supabase: SupabaseClient<Database>,
  requestedNext?: string | null,
): Promise<{ destination?: string; error?: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Your session could not be established. Please try again." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active, phone, phone_verified_at, requires_account_completion")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return { error: "Your account profile is unavailable. Please contact support." };
  if (!profile.is_active) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Your account is currently inactive. Please contact the administrator." };
  }

  const phoneReady = Boolean(user.phone && user.phone_confirmed_at && profile.phone && profile.phone_verified_at);
  if (!phoneReady || !profile.full_name || profile.requires_account_completion) {
    return { destination: "/account/complete-phone" };
  }

  const next = safeNextPath(requestedNext);
  if (next) return { destination: next };
  return { destination: staffRoles.has(profile.role) ? "/admin" : "/" };
}
