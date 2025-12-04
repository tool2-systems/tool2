import { NextResponse } from "next/server";
import { validateDemoToken } from "@/lib/token";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!validateDemoToken(token)) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  return NextResponse.json({ ok: true, message: "Token valid. File download will be implemented later." });
}
