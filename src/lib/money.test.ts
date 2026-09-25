import { describe, expect, it } from "vitest";
import { calculateLineTotal, calculateTax, roundMoney, weightedAverageCost } from "./money";

describe("decimal-safe money calculations", () => {
  it("avoids binary floating-point drift", () => {
    expect(roundMoney("0.1").plus(roundMoney("0.2")).toFixed(2)).toBe("0.30");
  });

  it("calculates line totals and discounts", () => {
    expect(calculateLineTotal("3", "48.25", "4.75").toFixed(2)).toBe("140.00");
  });

  it("calculates tax with commercial rounding", () => {
    expect(calculateTax("10000", "18").toFixed(2)).toBe("1800.00");
  });

  it("keeps precision in weighted average cost", () => {
    expect(weightedAverageCost("100", "40", "50", "44").toFixed(6)).toBe("41.333333");
  });
});
