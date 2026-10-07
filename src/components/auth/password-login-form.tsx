"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { resolveSignedInDestination } from "@/lib/auth/client";
import { parseLoginIdentifier } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function PasswordLoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedIdentifier = parseLoginIdentifier(identifier);
    if (!parsedIdentifier) {
      setMessage("Enter a valid Indian phone number or email address.");
      return;
    }
    if (!password) {
      setMessage("Enter your password.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const supabase = createClient();
      const credentials = "email" in parsedIdentifier
        ? { email: parsedIdentifier.email, password }
        : { phone: parsedIdentifier.phone, password };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        setMessage(authErrorMessage(error, "login"));
        return;
      }
      const result = await resolveSignedInDestination(supabase, nextPath);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.replace(result.destination ?? "/");
      router.refresh();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <label htmlFor="login-identifier">
        <span>Phone number or email</span>
        <input id="login-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" inputMode="email" placeholder="98765 43210 or user@example.com" required />
      </label>
      <PasswordInput label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
      <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>
      {message && <p className="auth-message" role="alert" aria-live="polite">{message}</p>}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Login"}</button>
    </form>
  );
}
