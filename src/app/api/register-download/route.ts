import { NextResponse } from "next/server";
import { linkTokenToResult } from "@/lib/resultStore";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const token = body?.token as string | undefined;
  const resultId = body?.resultId as string | undefined;

  if (!token || !resultId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  linkTokenToResult(token, resultId);

  return NextResponse.json({ ok: true });
}
