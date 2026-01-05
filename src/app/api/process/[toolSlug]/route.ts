import { getTool } from "@/tools"
import { getHandler } from "@/tools/handlers"
import { loadRun } from "@/lib/store"
import { getToolSlugFromParams } from "@/lib/route-params"
import { apiError } from "@/lib/api-error"

export async function POST(req: Request, ctx: { params: unknown }) {
  const toolSlug = await getToolSlugFromParams(ctx.params)
  if (!toolSlug) return apiError(404, "not_found")

  const tool = getTool(toolSlug)
  if (!tool) return apiError(404, "not_found")

  const handler = getHandler(toolSlug)
  if (!handler) return apiError(400, "no_handler")

  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return apiError(400, "no_run_id")

  const run = await loadRun(runId).catch(() => null)
  if (!run) return apiError(404, "run_not_found")

  if (run.toolSlug !== toolSlug) return apiError(400, "mismatch")

  const now = Date.now()
  const expired = typeof run.expiresAt === "number" ? now > run.expiresAt : false
  if (expired) return apiError(410, "expired")

  if (run.status !== "paid" && run.status !== "ready") {
    return apiError(402, "not_paid")
  }

  try {
    await handler.process({ tool, runId, run })
    return Response.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    return apiError(500, "processing_failed", { detail: msg })
  }
}
