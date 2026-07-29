// Polish phone numbers: 9 digits, optionally prefixed with +48/0048, with
// optional spaces/dashes as separators (e.g. "600 123 456", "+48 600-123-456").
const PHONE_REGEX = /^(?:\+48|0048)?\d{9}$/

function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}

export function isValidPhone(raw: string): boolean {
  return PHONE_REGEX.test(normalizePhone(raw))
}
