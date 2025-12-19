import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { loadRun } from "@/lib/store"

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params
  const run = await loadRun(runId)
  if (run.status !== "paid") return NextResponse.json({ error: "not paid" }, { status: 402 })

  const buf = await fs.readFile(run.outputPath).catch(() => null)
  if (!buf) return NextResponse.json({ error: "no output" }, { status: 404 })

  const filename = path.basename(run.outputPath)

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  })
}
