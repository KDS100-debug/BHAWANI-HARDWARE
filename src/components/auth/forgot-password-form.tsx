"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { useOtpCooldown } from "@/components/auth/use-otp-cooldown";
import { resolveSignedInDestination } from "@/lib/auth/client";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { passwordSchema, passwordsMatch } from "@/lib/auth/validation";
import { getPublicEnv } from "@/lib/env";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

type RecoveryStep = "phone" | "otp" | "password" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<RecoveryStep>("phone");
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  async function requestOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) return setMessage("Enter a valid registered Indian mobile number.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const channel = getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED ? "whatsapp" : "sms";
      const { error } = await createClient().auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: false, channel } });
      if (error) return setMessage(authErrorMessage(error, "otp-request"));
      setPendingPhone(normalized);
      setStep("otp");
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the complete 6-digit OTP.");
    if (attempts >= 5) return setMessage("Too many incorrect attempts. Request a new OTP.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.verifyOtp({ phone: pendingPhone, token: code, type: "sms" });
      if (error) {
        setAttempts((value) => value + 1);
        return setMessage(authErrorMessage(error, "otp-verify"));
      }
      setStep("password");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = passwordSchema.safeParse(password);
    if (!result.success) return setMessage(result.error.issues[0]?.message ?? "Use a stronger password.");
    if (!passwordsMatch(password, confirmation)) return setMessage("Passwords do not match.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({ password: result.data });
      if (error) return setMessage(authErrorMessage(error, "password"));
      setStep("success");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function continueAfterReset() {
    const supabase = createClient();
    const result = await resolveSignedInDestination(supabase);
    if (result.error) return setMessage(result.error);
    router.replace(result.destination ?? "/");
    router.refresh();
  }

  return (
    <AuthShell eyebrow="Secure account recovery" title={step === "success" ? "Password updated" : "Reset your password"} copy={step === "phone" ? "Use your registered phone number. Email is not required for recovery." : step === "otp" ? `Enter the OTP sent to ${maskPhoneNumber(pendingPhone)}.` : step === "password" ? "Create a new password for your account." : "Password updated successfully."}>
      {step === "phone" && <form className="auth-form" onSubmit={requestOtp}><PhoneInput value={phone} onChange={(event) => setPhone(event.target.value)} required />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Send OTP"}</button></form>}
      {step === "otp" && <form className="auth-form" onSubmit={verifyOtp}><OtpInput value={code} onChange={setCode} disabled={isSubmitting} />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify OTP"}</button><button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void requestOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button></form>}
      {step === "password" && <form className="auth-form" onSubmit={updatePassword}><PasswordInput label="New password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required showRequirements /><PasswordInput label="Confirm new password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating password..." : "Update password"}</button></form>}
      {step === "success" && <div className="auth-form"><p className="auth-success" role="status">Password updated successfully.</p>{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="button" onClick={() => void continueAfterReset()}>Continue securely</button></div>}
      <div className="auth-footer"><Link href="/login">Back to login</Link></div>
    </AuthShell>
  );
}
