import { loadRun, saveRun } from "@/lib/store"
import { apiError } from "@/lib/api-error"

const RUN_LIFETIME_MS = 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return apiError(400, "no_run_id")

  const run = await loadRun(runId).catch(() => null)
  if (!run) return apiError(404, "run_not_found")

  if (run.status === "preview_ready") {
    const paidAt = Date.now()
    run.status = "paid"
    run.paidAt = paidAt
    run.expiresAt = paidAt + RUN_LIFETIME_MS
    await saveRun(run)
  }

  return Response.json({ ok: true, status: run.status, expiresAt: run.expiresAt ?? null })
}
