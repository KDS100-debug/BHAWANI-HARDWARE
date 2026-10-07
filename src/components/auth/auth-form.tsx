"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpLoginForm } from "@/components/auth/otp-login-form";
import { PasswordLoginForm } from "@/components/auth/password-login-form";
import { createClient } from "@/lib/supabase/client";

type LoginTab = "password" | "otp";

export function AuthForm({ initialMessage = "", nextPath, forceSignOut = false }: { initialMessage?: string; nextPath?: string; forceSignOut?: boolean }) {
  const [tab, setTab] = useState<LoginTab>("password");

  useEffect(() => {
    if (forceSignOut) void createClient().auth.signOut({ scope: "local" });
  }, [forceSignOut]);

  return (
    <AuthShell eyebrow="Secure account access" title="Welcome back" copy="Use your phone with a password or receive a one-time code. Email remains an optional login credential.">
      <div className="auth-tabs" role="tablist" aria-label="Login method">
        <button className={tab === "password" ? "active" : ""} id="password-tab" role="tab" aria-controls="password-panel" aria-selected={tab === "password"} type="button" onClick={() => setTab("password")}>Password</button>
        <button className={tab === "otp" ? "active" : ""} id="otp-tab" role="tab" aria-controls="otp-panel" aria-selected={tab === "otp"} type="button" onClick={() => setTab("otp")}>OTP</button>
      </div>
      {initialMessage && <p className="auth-message" role="alert">{initialMessage}</p>}
      <div id={`${tab}-panel`} role="tabpanel" aria-labelledby={`${tab}-tab`}>
        {tab === "password" ? <PasswordLoginForm nextPath={nextPath} /> : <OtpLoginForm nextPath={nextPath} />}
      </div>
      <div className="auth-footer">
        <span>New to Bhawani Hardware?</span>
        <Link href="/signup">Create an account</Link>
      </div>
    </AuthShell>
  );
}
