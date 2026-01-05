import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import type { ToolHandler } from "./types"
import { saveRun, loadRun } from "@/lib/store"
import { inputsDir, outputsDir } from "@/lib/paths"
import { Run } from "@/lib/run"

export const countCsvRows: ToolHandler = {
  slug: "count-csv-rows",

  async preview({ tool, file }) {
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

    const previewMeta = {
      totalRows: lines.length,
      uniqueRows: lines.length,
      duplicates: 0
    }

    const run: Run = {
      id: runId,
      toolSlug: tool.slug,
      status: "preview_ready",
      createdAt: Date.now(),
      inputMeta: { filename: file.name, size: file.size },
      previewMeta,
      outputPath: outPath
    }

    await saveRun(run)

    return {
      raw,
      result: {
        runId,
        inputExt: "csv",
        previewMeta
      }
    }
  },

  async process({ tool, runId }) {
    const loaded = await loadRun(runId)
    if (loaded.toolSlug !== tool.slug) throw new Error("mismatch")

    const inputPath = path.join(inputsDir(), `${runId}.csv`)
    const raw = await fs.readFile(inputPath, "utf8")

    const normalized = raw.replace(/\r\n/g, "\n")
    await fs.writeFile(loaded.outputPath, normalized, "utf8")

    loaded.status = "ready"
    await saveRun(loaded)
  }
}
