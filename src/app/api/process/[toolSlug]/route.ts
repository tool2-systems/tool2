import { NextResponse } from "next/server"
import { getTool } from "@/tools"
import { getHandler } from "@/tools/handlers"
import { loadRun } from "@/lib/store"

export async function POST(req: Request, ctx: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await ctx.params

  const tool = getTool(toolSlug)
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 })

  const handler = getHandler(toolSlug)
  if (!handler) return NextResponse.json({ error: "no handler" }, { status: 400 })

  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return NextResponse.json({ error: "no runId" }, { status: 400 })

  const run = await loadRun(runId)
  if (run.toolSlug !== toolSlug) return NextResponse.json({ error: "mismatch" }, { status: 400 })

  const now = Date.now()
  const expired = typeof run.expiresAt === "number" ? now > run.expiresAt : false
  if (expired) return NextResponse.json({ error: "expired" }, { status: 410 })

  if (run.status !== "paid" && run.status !== "ready") return NextResponse.json({ error: "not paid" }, { status: 402 })

  try {
    await handler.process({ tool, runId, run })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "processing failed" }, { status: 500 })
  }
}
