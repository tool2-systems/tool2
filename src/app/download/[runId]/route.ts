import { NextResponse } from "next/server"
import { loadRun } from "@/lib/store"
import { promises as fs } from "fs"
import path from "path"

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params
  const run = await loadRun(runId)

  const now = Date.now()
  if (typeof run.expiresAt === "number" && now > run.expiresAt) {
    return NextResponse.json({ error: "expired" }, { status: 410 })
  }

  if (run.status !== "ready") {
    return NextResponse.json({ error: "not ready" }, { status: 409 })
  }

  const buf = await fs.readFile(run.outputPath)
  const filename = path.basename(run.outputPath)

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  })
}
