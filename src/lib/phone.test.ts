import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "./phone";

describe("normalizePhoneNumber", () => {
  it("normalizes Indian mobile numbers to E.164", () => {
    expect(normalizePhoneNumber("9876543210")).toBe("+919876543210");
    expect(normalizePhoneNumber("09876543210")).toBe("+919876543210");
    expect(normalizePhoneNumber("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("91 98765 43210")).toBe("+919876543210");
  });

  it("accepts an explicit international number", () => {
    expect(normalizePhoneNumber("(+1) 333-444-5555")).toBe("+13334445555");
  });

  it("rejects invalid or impossible numbers", () => {
    expect(normalizePhoneNumber("1234567890")).toBeNull();
    expect(normalizePhoneNumber("+0123456789")).toBeNull();
    expect(normalizePhoneNumber("+1234567")).toBeNull();
    expect(normalizePhoneNumber("+1234567890123456")).toBeNull();
  });
});
