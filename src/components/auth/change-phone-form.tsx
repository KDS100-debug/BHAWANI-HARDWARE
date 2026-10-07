"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { OtpInput } from "@/components/auth/otp-input";
import { PhoneInput } from "@/components/auth/phone-input";
import { useOtpCooldown } from "@/components/auth/use-otp-cooldown";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { getPublicEnv } from "@/lib/env";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

type PhoneStep = "idle" | "verify-current" | "new-phone" | "verify-new";

export function ChangePhoneForm({ currentPhone }: { currentPhone: string }) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<PhoneStep>("idle");
  const [newPhone, setNewPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  async function sendCurrentOtp() {
    setIsSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const channel = getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED ? "whatsapp" : "sms";
      const { error } = await createClient().auth.signInWithOtp({ phone: currentPhone, options: { shouldCreateUser: false, channel } });
      if (error) return setMessage(authErrorMessage(error, "otp-request"));
      setStep("verify-current");
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCurrentOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the complete 6-digit OTP.");
    if (attempts >= 5) return setMessage("Too many incorrect attempts. Request a new OTP.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.verifyOtp({ phone: currentPhone, token: code, type: "sms" });
      if (error) {
        setAttempts((value) => value + 1);
        return setMessage(authErrorMessage(error, "otp-verify"));
      }
      setStep("new-phone");
      setCode("");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestNewPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizePhoneNumber(newPhone);
    if (!normalized) return setMessage("Enter a valid Indian mobile number.");
    if (normalized === currentPhone) return setMessage("Enter a different phone number.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({ phone: normalized });
      if (error) return setMessage(authErrorMessage(error, "phone"));
      setPendingPhone(normalized);
      setStep("verify-new");
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyNewPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the complete 6-digit OTP.");
    if (attempts >= 5) return setMessage("Too many incorrect attempts. Request a new OTP.");
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.verifyOtp({ phone: pendingPhone, token: code, type: "phone_change" });
      if (error) {
        setAttempts((value) => value + 1);
        return setMessage(authErrorMessage(error, "otp-verify"));
      }
      setStep("idle");
      setNewPhone("");
      setPendingPhone("");
      setSuccess("Phone number changed successfully.");
      await refreshProfile();
      router.refresh();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendNewPhoneOtp() {
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

  if (step === "verify-current") {
    return <form className="security-form" onSubmit={verifyCurrentOtp}><p className="security-note">First verify your current phone: {maskPhoneNumber(currentPhone)}.</p><OtpInput value={code} onChange={setCode} disabled={isSubmitting} />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify current phone"}</button><button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void sendCurrentOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button><button className="text-button" type="button" onClick={() => setStep("idle")}>Cancel</button></form>;
  }

  if (step === "new-phone") {
    return <form className="security-form" onSubmit={requestNewPhone}><PhoneInput label="New phone number" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} required />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Send OTP to new phone"}</button></form>;
  }

  if (step === "verify-new") {
    return <form className="security-form" onSubmit={verifyNewPhone}><p className="security-note">Enter the OTP sent to {maskPhoneNumber(pendingPhone)}.</p><OtpInput value={code} onChange={setCode} disabled={isSubmitting} />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify new phone"}</button><button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void resendNewPhoneOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button></form>;
  }

  return <div className="security-form"><p className="security-note">Current phone: <strong>{maskPhoneNumber(currentPhone)}</strong></p>{message && <p className="auth-message" role="alert">{message}</p>}{success && <p className="auth-success" role="status">{success}</p>}<button className="button button-secondary" type="button" disabled={isSubmitting} onClick={() => void sendCurrentOtp()}>{isSubmitting ? "Sending OTP..." : "Change phone number"}</button></div>;
}
