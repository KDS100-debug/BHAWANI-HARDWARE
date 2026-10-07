"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { useOtpCooldown } from "@/components/auth/use-otp-cooldown";
import { resolveSignedInDestination } from "@/lib/auth/client";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { fullNameSchema } from "@/lib/auth/validation";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

export function CompletePhoneForm({ existingName, nextPath }: { existingName: string | null; nextPath?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(existingName ?? "");
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  async function requestVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameResult = fullNameSchema.safeParse(fullName);
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!nameResult.success) return setMessage(nameResult.error.issues[0]?.message ?? "Enter your full name.");
    if (!normalizedPhone) return setMessage("Enter a valid Indian mobile number.");

    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({
        phone: normalizedPhone,
        data: { full_name: nameResult.data },
      });
      if (error) return setMessage(authErrorMessage(error, "phone"));
      setPendingPhone(normalizedPhone);
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the complete 6-digit OTP.");
    if (attempts >= 5) return setMessage("Too many incorrect attempts. Request a new OTP.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: code, type: "phone_change" });
      if (error) {
        setAttempts((value) => value + 1);
        return setMessage(authErrorMessage(error, "otp-verify"));
      }
      const result = await resolveSignedInDestination(supabase, nextPath);
      if (result.error) return setMessage(result.error);
      router.replace(result.destination ?? "/");
      router.refresh();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendOtp() {
    if (!pendingPhone || !canResend) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({ type: "phone_change", phone: pendingPhone });
      if (error) return setMessage(authErrorMessage(error, "otp-request"));
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="Account completion required" title={pendingPhone ? "Verify your phone" : "Add your primary phone"} copy={pendingPhone ? `Enter the OTP sent to ${maskPhoneNumber(pendingPhone)}.` : "Your existing account will stay intact. Add a verified phone before continuing."}>
      {pendingPhone ? (
        <form className="auth-form" onSubmit={verifyPhone}>
          <OtpInput value={code} onChange={setCode} disabled={isSubmitting} />
          {message && <p className="auth-message" role="alert">{message}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify and continue"}</button>
          <button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void resendOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button>
          <button className="text-button" type="button" disabled={isSubmitting} onClick={() => { setPendingPhone(""); setCode(""); setMessage(""); }}>Change phone number</button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={requestVerification}>
          <label htmlFor="completion-name"><span>Full name</span><input id="completion-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>
          <PhoneInput value={phone} onChange={(event) => setPhone(event.target.value)} required />
          {message && <p className="auth-message" role="alert">{message}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Send verification OTP"}</button>
        </form>
      )}
    </AuthShell>
  );
}
