import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import { getTool } from "@/tools"
import { saveRun } from "@/lib/store"
import { inputsDir, outputsDir } from "@/lib/paths"
import { Run } from "@/lib/run"

export async function POST(req: Request, ctx: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await ctx.params
  const tool = getTool(toolSlug)
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 })

  if (toolSlug !== "remove-duplicate-csv") {
    return NextResponse.json({ error: "no handler" }, { status: 400 })
  }

  const text = await file.text()
  const raw = text.replace(/\r\n/g, "\n")

  const runId = randomUUID()

  await fs.mkdir(inputsDir(), { recursive: true })
  await fs.mkdir(outputsDir(), { recursive: true })

  const inputPath = path.join(inputsDir(), `${runId}.csv`)
  const outPath = path.join(outputsDir(), `${runId}.csv`)

  await fs.writeFile(inputPath, raw, "utf8")

  const trimmed = raw.trim()
  const lines = trimmed.length ? trimmed.split("\n") : []
  const unique = new Set(lines)

  const run: Run = {
    id: runId,
    toolSlug,
    status: "preview_ready",
    createdAt: Date.now(),
    inputMeta: { filename: file.name, size: file.size },
    previewMeta: {
      totalRows: lines.length,
      uniqueRows: unique.size,
      duplicates: lines.length - unique.size
    },
    outputPath: outPath
  }

  await saveRun(run)

  return NextResponse.json({ runId, preview: run.previewMeta })
}
