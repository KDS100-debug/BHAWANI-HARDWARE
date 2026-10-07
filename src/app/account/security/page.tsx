import { KeyRound, Mail, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ChangePhoneForm } from "@/components/auth/change-phone-form";
import { EmailManagementForm } from "@/components/auth/email-management-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentAccountContext } from "@/lib/auth/account.server";
import { maskPhoneNumber } from "@/lib/phone";

export const metadata = { title: "Account security" };

export default async function AccountSecurityPage() {
  const account = await getCurrentAccountContext();
  if (!account) redirect("/login?next=/account/security");
  if (!account.isReady || !account.phone) redirect("/account/complete-phone?next=/account/security");

  return (
    <main className="account-page">
      <div className="account-shell">
        <header className="account-header">
          <div><p className="eyebrow">Account settings</p><h1>Security & sign-in</h1><p>Manage the credentials connected to one Bhawani Hardware account.</p></div>
          <div className="account-header-actions"><Link className="button button-secondary" href={account.role === "customer" ? "/" : "/admin"}>Back</Link><SignOutButton /></div>
        </header>
        <section className="account-summary"><ShieldCheck size={22} /><div><strong>{account.fullName}</strong><span>{maskPhoneNumber(account.phone)} · {account.email ?? "No email added"}</span></div><span className="verified-badge">Phone verified</span></section>
        <div className="security-grid">
          <section className="security-card"><header><KeyRound size={21} /><div><h2>Change password</h2><p>Confirm the current password or recover with a phone OTP.</p></div></header><ChangePasswordForm phone={account.phone} /></section>
          <section className="security-card"><header><Smartphone size={21} /><div><h2>Change phone number</h2><p>Both the current phone and replacement number must be verified.</p></div></header><ChangePhoneForm currentPhone={account.phone} /></section>
          <section className="security-card"><header><Mail size={21} /><div><h2>Email login</h2><p>Add, change or remove the optional email on this same identity.</p></div></header><EmailManagementForm currentEmail={account.email} /></section>
        </div>
      </div>
    </main>
  );
}
