type CheckoutMeta = {
  toolSlug: string;
  resultId: string;
  createdAtMs: number;
};

const checkoutToMeta = new Map<string, CheckoutMeta>();

export function setCheckoutMeta(checkoutId: string, toolSlug: string, resultId: string): void {
  checkoutToMeta.set(checkoutId, { toolSlug, resultId, createdAtMs: Date.now() });
}

export function getCheckoutMeta(checkoutId: string): { toolSlug: string; resultId: string } | null {
  const meta = checkoutToMeta.get(checkoutId);
  if (!meta) return null;
  return { toolSlug: meta.toolSlug, resultId: meta.resultId };
}

export function deleteCheckoutMeta(checkoutId: string): void {
  checkoutToMeta.delete(checkoutId);
}

export function cleanupCheckoutMeta(ttlMs: number): void {
  const now = Date.now();
  for (const [checkoutId, meta] of checkoutToMeta.entries()) {
    if (now - meta.createdAtMs > ttlMs) {
      checkoutToMeta.delete(checkoutId);
    }
  }
}
