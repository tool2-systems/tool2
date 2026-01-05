import { NextResponse } from "next/server"
import { getTool } from "@/tools"
import { getHandler } from "@/tools/handlers"
import { copy } from "@/components/tool-runner/copy"

export async function POST(req: Request, ctx: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await ctx.params

  const tool = getTool(toolSlug)
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 })

  const handler = getHandler(toolSlug)
  if (!handler) return NextResponse.json({ error: "no handler" }, { status: 400 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 })

  const maxBytes = tool.input.maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: "too large", message: copy.fileTooLarge(tool.input.maxSizeMb) },
      { status: 413 }
    )
  }

  try {
    const { result } = await handler.preview({ tool, file })
    return NextResponse.json({ runId: result.runId, preview: result.previewMeta })
  } catch {
    return NextResponse.json({ error: "preview failed" }, { status: 500 })
  }
}
