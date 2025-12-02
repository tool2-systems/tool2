import { NextRequest } from "next/server";
import { processCsvDedupe } from "@/tools/csv-dedupe";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const resultBuffer = await processCsvDedupe(inputBuffer);

  return new Response(resultBuffer, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="deduped.csv"',
    },
  });
}
