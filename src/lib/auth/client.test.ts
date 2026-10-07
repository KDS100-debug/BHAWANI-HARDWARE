import { describe, expect, it } from "vitest";
import { isPhoneReadyForAccess } from "./client";

describe("isPhoneReadyForAccess", () => {
  it("accepts either profile or auth verification timestamps as valid", () => {
    expect(isPhoneReadyForAccess("+919876543210", null, "+919876543210", "2024-01-01T00:00:00Z")).toBe(true);
    expect(isPhoneReadyForAccess(null, "2024-01-01T00:00:00Z", "+919876543210", null)).toBe(true);
  });

  it("requires a phone number and a valid verification timestamp", () => {
    expect(isPhoneReadyForAccess(null, null, null, null)).toBe(false);
    expect(isPhoneReadyForAccess("+919876543210", null, null, null)).toBe(false);
    expect(isPhoneReadyForAccess(null, null, "+919876543210", null)).toBe(false);
  });
});
