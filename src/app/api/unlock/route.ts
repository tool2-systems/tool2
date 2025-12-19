import { NextResponse } from "next/server"
import { loadRun, saveRun } from "@/lib/store"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return NextResponse.json({ error: "no runId" }, { status: 400 })

  const run = await loadRun(runId)
  run.status = "paid"
  await saveRun(run)

  return NextResponse.json({ ok: true })
}
