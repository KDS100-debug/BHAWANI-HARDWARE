export function normalizePhoneNumber(input: string): string | null {
  const phone = input.replace(/[\s()-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
