import type { AuthError } from "@supabase/supabase-js";

type AuthOperation = "login" | "otp-request" | "otp-verify" | "signup" | "password" | "phone" | "email";

export function authErrorMessage(error: AuthError | null, operation: AuthOperation): string {
  if (!error) return "Unable to connect. Check your internet connection and try again.";

  switch (error.code) {
    case "invalid_credentials":
      return operation === "login" ? "Incorrect phone/email or password." : "The current password is incorrect.";
    case "otp_expired":
      return "This OTP has expired. Request a new OTP.";
    case "bad_code":
      return "The OTP is incorrect. Please try again.";
    case "otp_disabled":
      return "Phone OTP is not enabled yet. Please contact the administrator.";
    case "phone_provider_disabled":
      return "Phone sign-up is disabled. The administrator must enable Phone in the Supabase Auth providers settings.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return "Too many attempts. Please try again shortly.";
    case "phone_exists":
      return "This phone number is already associated with another account.";
    case "invalid_phone_number":
      return "The phone number is not valid. Use a valid mobile number and try again.";
    case "email_exists":
    case "user_already_exists":
      return "This email address is already associated with another account.";
    case "weak_password":
      return "Use a stronger password that meets every requirement.";
    case "same_password":
      return "Choose a password you have not used for this account.";
    case "user_banned":
      return "Your account is currently inactive. Please contact the administrator.";
  }

  const message = error.message.toLowerCase();
  if (message.includes("expired")) return "This OTP has expired. Request a new OTP.";
  if (operation === "otp-verify" && message.includes("invalid") && /otp|code|token/.test(message)) {
    return "The OTP is incorrect. Please try again.";
  }
  if (message.includes("rate") || message.includes("too many")) return "Too many attempts. Please try again shortly.";
  if (message.includes("phone") && (message.includes("registered") || message.includes("exists"))) {
    return "This phone number is already registered.";
  }
  if (message.includes("phone") && (message.includes("invalid") || message.includes("format"))) {
    return "The phone number is not valid. Use a valid mobile number and try again.";
  }
  if (message.includes("email") && message.includes("exists")) {
    return "This email address is already associated with another account.";
  }
  if (operation === "otp-request") return "No account was found for this phone number, or another code was requested too recently.";
  if (operation === "otp-verify") return "We couldn't verify this OTP. Request a new code and try again. If the problem continues, contact support.";
  if (operation === "signup") return "The account could not be created. Check your details and try again.";
  if (operation === "phone") return "The phone number could not be updated. Check the number and try again.";
  if (operation === "email") return "The email address could not be updated. Check it and try again.";
  if (operation === "password") return "The password could not be updated. Check the requirements and try again.";
  return "Incorrect phone/email or password.";
}

export const networkErrorMessage = "Unable to connect. Check your internet connection and try again.";
