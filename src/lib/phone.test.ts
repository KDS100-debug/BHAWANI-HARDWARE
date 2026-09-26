import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "./phone";

describe("normalizePhoneNumber", () => {
  it("accepts an international WhatsApp number", () => {
    expect(normalizePhoneNumber("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("(+1) 333-444-5555")).toBe("+13334445555");
  });

  it("rejects numbers without a country code or outside E.164 length", () => {
    expect(normalizePhoneNumber("9876543210")).toBeNull();
    expect(normalizePhoneNumber("+0123456789")).toBeNull();
    expect(normalizePhoneNumber("+1234567")).toBeNull();
    expect(normalizePhoneNumber("+1234567890123456")).toBeNull();
  });
});
