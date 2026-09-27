"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { CustomerPhoneAuth } from "@/components/auth/customer-phone-auth";

type AuthMode = "customer" | "admin";

export function AuthForm({ initialMode = "customer", initialMessage = "" }: { initialMode?: AuthMode; initialMessage?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const supabase = createClient();
    const result = isSignUp && mode === "customer"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }
    if (isSignUp && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      setIsSubmitting(false);
      return;
    }
    router.push(mode === "admin" ? "/admin" : "/");
    router.refresh();
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIsSignUp(false);
    setMessage("");
  }

  if (mode === "customer" && getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED) {
    return <CustomerPhoneAuth onStaffClick={() => changeMode("admin")} />;
  }

  return <main className="auth-page"><section className="auth-panel"><Link className="auth-brand" href="/">BH <span>Bhawani Hardware</span></Link><div className="auth-tabs" role="tablist" aria-label="Login type"><button className={mode === "customer" ? "active" : ""} role="tab" aria-selected={mode === "customer"} type="button" onClick={() => changeMode("customer")}>Customer</button><button className={mode === "admin" ? "active" : ""} role="tab" aria-selected={mode === "admin"} type="button" onClick={() => changeMode("admin")}>Admin / Staff</button></div><p className="eyebrow">{mode === "admin" ? "Business access" : "Customer account"}</p><h1>{isSignUp ? "Create your account" : mode === "admin" ? "Business sign in" : "Welcome back"}</h1><p className="auth-copy">{mode === "admin" ? "Your role and permissions determine the workspace you can access." : "Sign in to keep your details ready for checkout."}</p><form className="auth-form" onSubmit={submit}>{isSignUp && mode === "customer" && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} required /></label>{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}</button></form>{mode === "customer" && <button className="auth-switch" type="button" onClick={() => { setIsSignUp((current) => !current); setMessage(""); }}>{isSignUp ? "Already have an account? Sign in" : "New customer? Create an account"}</button>}</section></main>;
}
