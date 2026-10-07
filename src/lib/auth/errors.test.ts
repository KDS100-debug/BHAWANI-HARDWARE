import { AuthError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage OTP verification", () => {
  it("identifies an incorrect OTP", () => {
    expect(authErrorMessage(new AuthError("Invalid OTP", 400, "bad_code"), "otp-verify"))
      .toBe("The OTP is incorrect. Please try again.");
  });

  it("identifies an expired OTP", () => {
    expect(authErrorMessage(new AuthError("Token expired", 400, "otp_expired"), "otp-verify"))
      .toBe("This OTP has expired. Request a new OTP.");
  });

  it("does not report other verification failures as an incorrect OTP", () => {
    expect(authErrorMessage(new AuthError("Provider unavailable", 500, "unexpected_failure"), "otp-verify"))
      .toBe("We couldn't verify this OTP. Request a new code and try again. If the problem continues, contact support.");
  });
});