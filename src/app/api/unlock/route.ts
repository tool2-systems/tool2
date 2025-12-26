import { NextResponse } from "next/server"
import { loadRun, saveRun } from "@/lib/store"

const RUN_LIFETIME_MS = 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return NextResponse.json({ error: "no runId" }, { status: 400 })

  const run = await loadRun(runId)

  if (run.status === "preview_ready") {
    const paidAt = Date.now()
    run.status = "paid"
    run.paidAt = paidAt
    run.expiresAt = paidAt + RUN_LIFETIME_MS
    await saveRun(run)
  }

  return NextResponse.json({ ok: true, status: run.status, expiresAt: run.expiresAt ?? null })
}
