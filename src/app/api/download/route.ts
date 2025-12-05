import { NextResponse } from "next/server";
import { consumeResultForToken } from "@/lib/resultStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const stored = consumeResultForToken(token);

  if (!stored) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  return new NextResponse(stored.content, {
    status: 200,
    headers: {
      "Content-Type": stored.mimeType,
      "Content-Disposition": `attachment; filename="${stored.fileName}"`,
    },
  });
}
