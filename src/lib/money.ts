import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type DecimalInput = Decimal.Value;

export function money(value: DecimalInput): Decimal {
  const parsed = new Decimal(value);
  if (!parsed.isFinite()) throw new Error("Money value must be finite");
  return parsed;
}

export function roundMoney(value: DecimalInput): Decimal {
  return money(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateLineTotal(quantity: DecimalInput, unitPrice: DecimalInput, discount: DecimalInput = 0): Decimal {
  const total = money(quantity).mul(unitPrice).minus(discount);
  if (total.isNegative()) throw new Error("Discount cannot exceed line value");
  return roundMoney(total);
}

export function calculateTax(taxableValue: DecimalInput, ratePercent: DecimalInput): Decimal {
  return roundMoney(money(taxableValue).mul(ratePercent).div(100));
}

export function weightedAverageCost(
  existingQuantity: DecimalInput,
  existingUnitCost: DecimalInput,
  incomingQuantity: DecimalInput,
  incomingUnitCost: DecimalInput,
): Decimal {
  const oldQty = money(existingQuantity);
  const newQty = money(incomingQuantity);
  const totalQty = oldQty.plus(newQty);
  if (oldQty.isNegative() || newQty.lte(0) || totalQty.lte(0)) throw new Error("Invalid quantities for weighted average");
  return oldQty.mul(existingUnitCost).plus(newQty.mul(incomingUnitCost)).div(totalQty);
}
