import { NextResponse } from "next/server"
import { loadRun } from "@/lib/store"
import { apiError } from "@/lib/api-error"
import { getTool } from "@/tools"
import { promises as fs } from "fs"

function contentTypeFromExt(ext: string) {
  const e = ext.toLowerCase().replace(/^\./, "")
  if (e === "csv") return "text/csv; charset=utf-8"
  if (e === "txt") return "text/plain; charset=utf-8"
  if (e === "json") return "application/json; charset=utf-8"
  return "application/octet-stream"
}

export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params
  if (!runId) return apiError(404, "not_found")

  const run = await loadRun(runId).catch(() => null)
  if (!run) return apiError(404, "run_not_found")

  const now = Date.now()
  if (typeof run.expiresAt === "number" && now > run.expiresAt) {
    return apiError(410, "expired")
  }

  if (run.status !== "ready") {
    return apiError(409, "not_ready")
  }

  const tool = getTool(run.toolSlug)
  const outputExt = (tool?.outputExt ?? "csv").replace(/^\./, "").toLowerCase()
  const buf = await fs.readFile(run.outputPath)
  const filename = `${run.toolSlug}-${run.id}.${outputExt}`

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": contentTypeFromExt(outputExt),
      "content-disposition": `attachment; filename="${filename}"`
    }
  })
}
