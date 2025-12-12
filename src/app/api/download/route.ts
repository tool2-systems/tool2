import { NextResponse } from "next/server";
import { consumeResultForToken } from "@/lib/resultStore";
import { cleanupTempFiles } from "@/lib/files";

export async function GET(req: Request) {
  await cleanupTempFiles(300000);

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const stored = await consumeResultForToken(token);

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
