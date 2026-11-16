/** Parse the PIN, never digits from a URL's hostname or port. */
export function parseJoinCode(value: string): string | null {
  const plain = value.trim().replace(/[\s\u200B-\u200D\uFEFF-]/g, "");
  if (/^\d{6}$/.test(plain)) return plain;
  try {
    const url = new URL(value.trim());
    const pin = url.searchParams.get("pin");
    return ["http:", "https:"].includes(url.protocol) && pin && /^\d{6}$/.test(pin) ? pin : null;
  } catch {
    return null;
  }
}
