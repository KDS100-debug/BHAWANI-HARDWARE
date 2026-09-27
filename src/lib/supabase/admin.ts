import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";
import { getSupabaseAdminEnv } from "@/lib/env.server";

export function createAdminClient() {
  const env = getSupabaseAdminEnv();
  if (!env) return null;

  return createSupabaseClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
