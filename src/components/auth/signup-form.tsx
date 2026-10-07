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
import { fullNameSchema, normalizeOptionalEmail, optionalEmailSchema, passwordSchema, passwordsMatch } from "@/lib/auth/validation";
import { getPublicEnv } from "@/lib/env";
import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

type Registration = { fullName: string; phone: string; email: string | null; password: string };

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { remaining, canResend, restart } = useOtpCooldown();

  async function startSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameResult = fullNameSchema.safeParse(fullName);
    const emailResult = optionalEmailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!nameResult.success) return setMessage(nameResult.error.issues[0]?.message ?? "Enter your full name.");
    if (!normalizedPhone) return setMessage("Enter a valid Indian mobile number.");
    if (!emailResult.success) return setMessage(emailResult.error.issues[0]?.message ?? "Enter a valid email address.");
    if (!passwordResult.success) return setMessage(passwordResult.error.issues[0]?.message ?? "Use a stronger password.");
    if (!passwordsMatch(password, confirmation)) return setMessage("Passwords do not match.");

    const details = { fullName: nameResult.data, phone: normalizedPhone, email: normalizeOptionalEmail(email), password: passwordResult.data };
    setIsSubmitting(true);
    setMessage("");
    try {
      const channel = getPublicEnv().NEXT_PUBLIC_WHATSAPP_OTP_ENABLED ? "whatsapp" : "sms";
      const { data, error } = await createClient().auth.signUp({
        phone: details.phone,
        password: details.password,
        options: { data: { full_name: details.fullName }, channel },
      });
      if (error) {
        setMessage(authErrorMessage(error, "signup"));
        return;
      }
      if (data.user?.identities?.length === 0) {
        setMessage("This phone number is already registered.");
        return;
      }
      setRegistration(details);
      setCode("");
      setAttempts(0);
      restart();
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finishSignup() {
    const supabase = createClient();
    const result = await resolveSignedInDestination(supabase);
    if (result.error) return setMessage(result.error);
    router.replace(result.destination ?? "/");
    router.refresh();
  }

  async function verifySignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registration || !/^\d{6}$/.test(code)) return setMessage("Enter the complete 6-digit OTP.");
    if (attempts >= 5) return setMessage("Too many incorrect attempts. Request a new OTP.");

    setIsSubmitting(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ phone: registration.phone, token: code, type: "sms" });
      if (error) {
        setAttempts((value) => value + 1);
        setMessage(authErrorMessage(error, "otp-verify"));
        return;
      }

      if (registration.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: registration.email });
        if (emailError) {
          setCompletionMessage("Your phone account is ready, but the optional email could not be added. You can add another email later in Account Security.");
          return;
        }
      }
      setCompletionMessage(registration.email
        ? "Your phone is verified. Check your email to confirm it as an additional login credential."
        : "Your phone is verified and your account is ready.");
    } catch {
      setMessage(networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendSignupOtp() {
    if (!registration || !canResend) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.resend({ type: "sms", phone: registration.phone });
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
    <AuthShell eyebrow="Phone-first registration" title={completionMessage ? "Account created" : registration ? "Verify your phone" : "Create your account"} copy={completionMessage ? "Your password is securely managed by Supabase Auth." : registration ? `Enter the OTP sent to ${maskPhoneNumber(registration.phone)}.` : "Your phone is required. Email is optional and can be added to the same account."}>
      {completionMessage ? (
        <div className="auth-form">
          <p className="auth-success" role="status">{completionMessage}</p>
          <button className="button button-primary" type="button" onClick={() => void finishSignup()}>Continue</button>
        </div>
      ) : registration ? (
        <form className="auth-form" onSubmit={verifySignup}>
          <OtpInput value={code} onChange={setCode} disabled={isSubmitting} />
          {message && <p className="auth-message" role="alert" aria-live="polite">{message}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting || attempts >= 5}>{isSubmitting ? "Verifying..." : "Verify phone and create account"}</button>
          <button className="auth-switch" type="button" disabled={!canResend || isSubmitting} onClick={() => void resendSignupOtp()}>{canResend ? "Resend OTP" : `Resend OTP in ${remaining} seconds`}</button>
          <button className="text-button" type="button" disabled={isSubmitting} onClick={() => { setRegistration(null); setMessage(""); }}>Edit account details</button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={startSignup} noValidate>
          <label htmlFor="signup-name"><span>Full name <b aria-hidden="true">*</b></span><input id="signup-name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
          <PhoneInput value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <label htmlFor="signup-email"><span>Email <small>Optional</small></span><input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
          <PasswordInput label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required showRequirements />
          <PasswordInput label="Confirm password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
          {message && <p className="auth-message" role="alert" aria-live="polite">{message}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Continue with phone verification"}</button>
        </form>
      )}
      <div className="auth-footer"><span>Already have an account?</span><Link href="/login">Login</Link></div>
    </AuthShell>
  );
}
