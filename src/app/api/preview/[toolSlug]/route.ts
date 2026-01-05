import { getTool } from "@/tools"
import { getHandler } from "@/tools/handlers"
import { copy } from "@/components/tool-runner/copy"
import { getToolSlugFromParams } from "@/lib/route-params"
import { apiError } from "@/lib/api-error"

export async function POST(req: Request, ctx: { params: unknown }) {
  const toolSlug = await getToolSlugFromParams(ctx.params)
  if (!toolSlug) return apiError(404, "not_found")

  const tool = getTool(toolSlug)
  if (!tool) return apiError(404, "not_found")

  const handler = getHandler(toolSlug)
  if (!handler) return apiError(400, "no_handler")

  const form = await req.formData().catch(() => null)
  if (!form) return apiError(400, "bad_form_data")

  const file = form.get("file") as File | null
  if (!file) return apiError(400, "no_file")

  const maxBytes = tool.input.maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    return apiError(413, "file_too_large", { message: copy.fileTooLarge(tool.input.maxSizeMb) })
  }

  try {
    const { result } = await handler.preview({ tool, file })
    return Response.json({ runId: result.runId, preview: result.previewMeta })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown"
    return apiError(500, "preview_failed", { detail: msg })
  }
}
