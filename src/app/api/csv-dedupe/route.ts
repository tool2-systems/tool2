import { NextResponse } from "next/server";
import { processCsvDedupe } from "@/tools/csv-dedupe";
import { createResult } from "@/lib/resultStore";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return new NextResponse("File is required", { status: 400 });
  }

  const arrayBuffer = await (file as File).arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const resultBuffer = await processCsvDedupe(inputBuffer);
  const resultText = resultBuffer.toString("utf-8");

  const lines = resultText
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  const preview = lines.slice(0, 5).join("\n");

  const stored = await createResult(
    resultText,
    "text/csv; charset=utf-8",
    "result.csv"
  );

  return NextResponse.json({
    preview,
    resultId: stored.id,
  });
}
