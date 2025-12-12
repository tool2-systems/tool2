import { NextResponse } from "next/server";
import crypto from "crypto";
import { cleanupCheckoutMeta, setCheckoutMeta } from "@/lib/checkoutStore";

export async function POST(req: Request) {
  cleanupCheckoutMeta(300000);

  const body = await req.json().catch(() => null);

  const toolSlug = body?.toolSlug as string | undefined;
  const resultId = body?.resultId as string | undefined;

  if (!toolSlug || !resultId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const checkoutId = crypto.randomUUID();
  setCheckoutMeta(checkoutId, toolSlug, resultId);

  return NextResponse.json({
    ok: true,
    checkoutId,
    checkoutUrl: "https://example.com/checkout",
  });
}
