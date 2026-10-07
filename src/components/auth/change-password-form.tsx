"use client";

import { type FormEvent, useState } from "react";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { useOtpCooldown } from "@/components/auth/use-otp-cooldown";
import { authErrorMessage, networkErrorMessage } from "@/lib/auth/errors";
import { passwordSchema, passwordsMatch } from "@/lib/auth/validation";
import { getPublicEnv } from "@/lib/env";
import { maskPhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

type OtpStep = "idle" | "verify" | "new-password";

export function ChangePasswordForm({ phone }: { phone: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  function validateNewPassword() {
    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? "Use a stronger password.");
      return null;
    }
    if (!passwordsMatch(newPassword, confirmation)) {
      setMessage("Passwords do not match.");
      return null;
    }
    return result.data;
  }

  async function changeWithCurrentPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validatedPassword = validateNewPassword();
    if (!currentPassword || !validatedPassword) return;
    setIsSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password: currentPassword });
      if (signInError) return setMessage(authErrorMessage(signInError, "login"));
      const { error } = await supabase.auth.updateUser({ current_password: currentPassword, password: validatedPassword });
      if (error) return setMessage(authErrorMessage(error, "password"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setSuccess("Password changed successfully.");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestOtp() {
    setIsSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const channel = getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED ? "whatsapp" : "sms";
      const { error } = await createClient().auth.signInWithOtp({ phone, options: { shouldCreateUser: false, channel } });
      if (error) return setMessage(authErrorMessage(error, "otp-request"));
      setOtpStep("verify");
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
      const { error } = await createClient().auth.verifyOtp({ phone, token: code, type: "sms" });
      if (error) {
        setAttempts((value) => value + 1);
        return setMessage(authErrorMessage(error, "otp-verify"));
      }
      setOtpStep("new-password");
      setNewPassword("");
      setConfirmation("");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateAfterOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validatedPassword = validateNewPassword();
    if (!validatedPassword) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.updateUser({ password: validatedPassword });
      if (error) return setMessage(authErrorMessage(error, "password"));
      setOtpStep("idle");
      setNewPassword("");
      setConfirmation("");
      setSuccess("Password changed successfully.");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (otpStep === "verify") {
    return <form className="security-form" onSubmit={verifyOtp}><p className="security-note">Enter the OTP sent to {maskPhoneNumber(phone)}.</p><OtpInput value={code} onChange={setCode} disabled={isSubmitting} />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify OTP"}</button><button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void requestOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button><button className="text-button" type="button" onClick={() => setOtpStep("idle")}>Cancel</button></form>;
  }

  if (otpStep === "new-password") {
    return <form className="security-form" onSubmit={updateAfterOtp}><PasswordInput label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required showRequirements /><PasswordInput label="Confirm new password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />{message && <p className="auth-message" role="alert">{message}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating password..." : "Update password"}</button></form>;
  }

  return <form className="security-form" onSubmit={changeWithCurrentPassword}><PasswordInput label="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /><PasswordInput label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required showRequirements /><PasswordInput label="Confirm new password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />{message && <p className="auth-message" role="alert">{message}</p>}{success && <p className="auth-success" role="status">{success}</p>}<button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating password..." : "Update password"}</button><button className="auth-switch align-left" type="button" disabled={isSubmitting} onClick={() => void requestOtp()}>Forgot current password? Verify using OTP</button></form>;
}
