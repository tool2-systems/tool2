import crypto from "crypto";

export function createPaymentToken(): string {
  return "pay_" + crypto.randomBytes(24).toString("hex");
}

export function isPaymentToken(token: string | null): boolean {
  return !!token && token.startsWith("pay_");
}
