"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { optionalEmailSchema } from "@/lib/auth/validation";
import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function EmailManagementForm({ currentEmail }: { currentEmail: string | null }) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState(currentEmail ?? "");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = optionalEmailSchema.safeParse(email);
    if (!result.success || !result.data) return setMessage(result.success ? "Enter an email address." : result.error.issues[0]?.message ?? "Enter a valid email address.");
    if (result.data === currentEmail) return setMessage("Enter a different email address.");
    setIsSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const redirectTo = `${getPublicEnv().NEXT_PUBLIC_APP_URL}/account/security`;
      const { error } = await createClient().auth.updateUser({ email: result.data }, { emailRedirectTo: redirectTo });
      if (error) return setMessage(authErrorMessage(error, "email"));
      setSuccess("Check the new email address to confirm it. Your phone login remains active.");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeEmail() {
    if (!currentEmail || !window.confirm("Remove this optional email? Phone login will remain active.")) return;
    setIsSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) return setMessage(authErrorMessage(error, "email"));
      const emailIdentity = data.identities.find((identity) => identity.provider === "email");
      if (!emailIdentity || data.identities.length < 2) {
        setMessage("This email cannot be removed through Supabase Auth. You can change it instead.");
        return;
      }
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(emailIdentity);
      if (unlinkError) return setMessage(authErrorMessage(unlinkError, "email"));
      setEmail("");
      setSuccess("Email removed. Phone password and OTP login remain active.");
      await refreshProfile();
      router.refresh();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <form className="security-form" onSubmit={updateEmail}><label htmlFor="account-email"><span>{currentEmail ? "Change email" : "Add email"} <small>Optional</small></span><input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required /></label><p className="security-note">Email is an additional login credential. Your verified phone remains primary.</p>{message && <p className="auth-message" role="alert">{message}</p>}{success && <p className="auth-success" role="status">{success}</p>}<div className="security-actions"><button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating email..." : currentEmail ? "Change email" : "Add email"}</button>{currentEmail && <button className="button button-danger" type="button" disabled={isSubmitting} onClick={() => void removeEmail()}>Remove email</button>}</div></form>;
}
