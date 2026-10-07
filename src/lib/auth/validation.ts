import { z } from "zod";
import { normalizePhoneNumber } from "@/lib/phone";

export const fullNameSchema = z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long.");
export const optionalEmailSchema = z.union([
  z.literal(""),
  z.string().trim().toLowerCase().email("Enter a valid email address."),
]);
export const passwordSchema = z.string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.");

export function parseLoginIdentifier(value: string): { email: string } | { phone: string } | null {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    const result = z.string().email().safeParse(trimmed.toLowerCase());
    return result.success ? { email: result.data } : null;
  }
  const phone = normalizePhoneNumber(trimmed);
  return phone ? { phone } : null;
}

export function normalizeOptionalEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation;
}
