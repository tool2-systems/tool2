type Entry = {
  token: string;
  createdAtMs: number;
};

const checkoutToEntry = new Map<string, Entry>();

export function setCheckoutPaid(checkoutId: string, token: string): void {
  checkoutToEntry.set(checkoutId, { token, createdAtMs: Date.now() });
}

export function getCheckoutToken(checkoutId: string): string | null {
  const entry = checkoutToEntry.get(checkoutId);
  return entry ? entry.token : null;
}

export function cleanupCheckoutStore(ttlMs: number): void {
  const now = Date.now();

  for (const [checkoutId, entry] of checkoutToEntry.entries()) {
    if (now - entry.createdAtMs > ttlMs) {
      checkoutToEntry.delete(checkoutId);
    }
  }
}
