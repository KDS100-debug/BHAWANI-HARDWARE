"use client";

import { KeyRound } from "lucide-react";
import { createStaffAction } from "@/app/admin/staff/actions";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneInput } from "@/components/auth/phone-input";

export function StaffCreateForm() {
  return (
    <form className="management-form staff-create-form" action={createStaffAction}>
      <label>Full name<input name="fullName" required minLength={2} maxLength={120} autoComplete="off" /></label>
      <PhoneInput name="phone" required autoComplete="off" />
      <label>Email <small>Optional</small><input name="email" type="email" autoComplete="off" /></label>
      <PasswordInput name="password" label="Temporary password" required minLength={12} autoComplete="new-password" showRequirements />
      <PasswordInput name="confirmPassword" label="Confirm password" required minLength={12} autoComplete="new-password" />
      <button className="button button-primary" type="submit"><KeyRound size={17} /> Create staff</button>
    </form>
  );
}
