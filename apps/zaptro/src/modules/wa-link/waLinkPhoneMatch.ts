export function waLinkPhoneDigits(p: string | null | undefined): string {
  return String(p ?? '').replace(/\D/g, '');
}

export function waLinkPhonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = waLinkPhoneDigits(a);
  const db = waLinkPhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const tail = (s: string) => (s.length >= 11 ? s.slice(-11) : s);
  return tail(da) === tail(db);
}
