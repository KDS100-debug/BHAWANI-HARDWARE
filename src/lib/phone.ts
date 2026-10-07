const e164Pattern = /^\+[1-9]\d{7,14}$/;
const indianMobilePattern = /^[6-9]\d{9}$/;

export function normalizePhoneNumber(input: string, defaultCountryCode = "+91"): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasInternationalPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  let candidate: string;

  if (hasInternationalPrefix) {
    candidate = `+${digits}`;
  } else if (defaultCountryCode === "+91") {
    const indianDigits = digits.startsWith("0") && digits.length === 11 ? digits.slice(1) : digits;
    if (indianDigits.startsWith("91") && indianDigits.length === 12) {
      candidate = `+${indianDigits}`;
    } else if (indianMobilePattern.test(indianDigits)) {
      candidate = `+91${indianDigits}`;
    } else {
      return null;
    }
  } else {
    candidate = `${defaultCountryCode}${digits}`;
  }

  return e164Pattern.test(candidate) ? candidate : null;
}

export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "your phone";
  const countryLength = normalized.startsWith("+91") ? 3 : Math.max(2, normalized.length - 10);
  return `${normalized.slice(0, countryLength)} ${"•".repeat(Math.max(4, normalized.length - countryLength - 4))}${normalized.slice(-4)}`;
}

export function isE164PhoneNumber(phone: string): boolean {
  return e164Pattern.test(phone);
}
