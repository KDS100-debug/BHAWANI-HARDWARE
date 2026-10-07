"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { OtpInput } from "@/components/auth/otp-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { useOtpCooldown } from "@/components/auth/use-otp-cooldown";
import { resolveSignedInDestination } from "@/lib/auth/client";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { getPublicEnv } from "@/lib/env";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

export function OtpLoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) {
      setMessage("Enter a valid Indian mobile number.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const channel = getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED ? "whatsapp" : "sms";
      const { error } = await createClient().auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: false, channel },
      });
      if (error) {
        setMessage(authErrorMessage(error, "otp-request"));
        return;
      }
      setPendingPhone(normalized);
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the complete 6-digit OTP.");
      return;
    }
    if (attempts >= 5) {
      setMessage("Too many incorrect attempts. Request a new OTP.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: code, type: "sms" });
      if (error) {
        setAttempts((value) => value + 1);
        setMessage(authErrorMessage(error, "otp-verify"));
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

  if (pendingPhone) {
    return (
      <form className="auth-form" onSubmit={verifyCode}>
        <div className="otp-heading"><strong>Enter OTP</strong><span>OTP sent to {maskPhoneNumber(pendingPhone)}</span></div>
        <OtpInput value={code} onChange={setCode} disabled={isSubmitting} />
        {message && <p className="auth-message" role="alert" aria-live="polite">{message}</p>}
        <button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify OTP"}</button>
        <button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void sendCode()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button>
        <button className="text-button" type="button" disabled={isSubmitting} onClick={() => { setPendingPhone(""); setCode(""); setMessage(""); }}>Use a different number</button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={sendCode}>
      <PhoneInput value={phone} onChange={(event) => setPhone(event.target.value)} required />
      {message && <p className="auth-message" role="alert" aria-live="polite">{message}</p>}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Send OTP"}</button>
    </form>
  );
}
