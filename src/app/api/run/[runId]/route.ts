import { NextResponse } from "next/server"
import { loadRun, runExists } from "@/lib/store"

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params
  const exists = await runExists(runId)
  if (!exists) return NextResponse.json({ error: "not found" }, { status: 404 })

  const run = await loadRun(runId)
  const now = Date.now()
  const expired = typeof run.expiresAt === "number" ? now > run.expiresAt : false

  return NextResponse.json({
    runId: run.id,
    toolSlug: run.toolSlug,
    status: run.status,
    expired,
    expiresAt: run.expiresAt ?? null,
    preview: run.previewMeta ?? null
  })
}
