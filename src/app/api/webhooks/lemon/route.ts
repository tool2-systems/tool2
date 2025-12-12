import { NextResponse } from "next/server";
import { createPaymentToken } from "@/lib/paymentToken";

const checkoutToToken = new Map<string, string>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const checkoutId = body?.checkoutId as string | undefined;

  if (!checkoutId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const token = createPaymentToken();
  checkoutToToken.set(checkoutId, token);

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkoutId = searchParams.get("checkoutId");

  if (!checkoutId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const token = checkoutToToken.get(checkoutId);

  if (!token) {
    return NextResponse.json({ ok: false, status: "pending" });
  }

  return NextResponse.json({ ok: true, status: "paid", token });
}
