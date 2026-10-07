import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/client";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>(["email", "email_change", "signup", "recovery"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next")) ?? "/account/security";

  if (tokenHash && type && allowedTypes.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "confirmation");
  return NextResponse.redirect(loginUrl);
}
