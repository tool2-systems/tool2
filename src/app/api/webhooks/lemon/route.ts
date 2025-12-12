import { NextResponse } from "next/server";
import { createPaymentToken } from "@/lib/paymentToken";
import { cleanupCheckoutStore, getCheckoutToken, setCheckoutPaid } from "@/lib/paymentStore";
import { cleanupCheckoutMeta, deleteCheckoutMeta, getCheckoutMeta } from "@/lib/checkoutStore";
import { linkTokenToResult } from "@/lib/resultStore";

export async function POST(req: Request) {
  cleanupCheckoutStore(300000);
  cleanupCheckoutMeta(300000);

  const body = await req.json().catch(() => null);
  const checkoutId = body?.checkoutId as string | undefined;

  if (!checkoutId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const meta = getCheckoutMeta(checkoutId);

  if (!meta) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = createPaymentToken();

  linkTokenToResult(token, meta.resultId);
  setCheckoutPaid(checkoutId, token);
  deleteCheckoutMeta(checkoutId);

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  cleanupCheckoutStore(300000);

  const { searchParams } = new URL(req.url);
  const checkoutId = searchParams.get("checkoutId");

  if (!checkoutId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const token = getCheckoutToken(checkoutId);

  if (!token) {
    return NextResponse.json({ ok: false, status: "pending" });
  }

  return NextResponse.json({ ok: true, status: "paid", token });
}
