"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { normalizePhoneNumber } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

export function CustomerPhoneAuth({ onStaffClick }: { onStaffClick: () => void }) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      setMessage("Enter a phone number with country code, for example +91 98765 43210.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: "whatsapp",
          shouldCreateUser: isSignUp,
          ...(isSignUp ? { data: { full_name: fullName.trim() } } : {}),
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setPendingPhone(normalizedPhone);
      setCode("");
    } catch {
      setMessage("Could not request a code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setMessage("Enter the 6-digit code from WhatsApp.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      // Supabase uses the `sms` OTP type for phone codes, including WhatsApp delivery.
      const { data, error } = await createClient().auth.verifyOtp({
        phone: pendingPhone,
        token: code.trim(),
        type: "sms",
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      if (!data.session) {
        setMessage("The code could not be verified. Request a new code and try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setMessage("Could not verify the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetCode() {
    setPendingPhone("");
    setCode("");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">BH <span>Bhawani Hardware</span></Link>
        <div className="auth-tabs" role="tablist" aria-label="Login type">
          <button className="active" role="tab" aria-selected="true" type="button">Customer</button>
          <button role="tab" aria-selected="false" type="button" onClick={onStaffClick}>Staff</button>
        </div>
        <p className="eyebrow">Customer account</p>
        <h1>{pendingPhone ? "Check WhatsApp" : isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-copy">{pendingPhone
          ? `Enter the code sent to ${pendingPhone}.`
          : "Use your WhatsApp number to receive a one-time sign-in code. No email or password required."}</p>
        {pendingPhone ? (
          <form className="auth-form" onSubmit={verifyCode}>
            <label>WhatsApp code<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required /></label>
            {message && <p className="auth-message" role="alert">{message}</p>}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Verifying..." : "Verify and sign in"}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={requestCode}>
            {isSignUp && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>}
            <label>WhatsApp phone number<input type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
            {message && <p className="auth-message" role="alert">{message}</p>}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send WhatsApp code"}</button>
          </form>
        )}
        {pendingPhone ? (
          <button className="auth-switch" type="button" onClick={resetCode}>Change number or request a new code</button>
        ) : (
          <button className="auth-switch" type="button" onClick={() => { setIsSignUp((current) => !current); setMessage(""); }}>
            {isSignUp ? "Already have an account? Sign in" : "New customer? Create an account"}
          </button>
        )}
      </section>
    </main>
  );
}
