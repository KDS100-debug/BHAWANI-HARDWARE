import "server-only";

import { z } from "zod";

const adminEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(30),
});

export function getSupabaseAdminEnv() {
  const result = adminEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  return result.success ? result.data : null;
}
