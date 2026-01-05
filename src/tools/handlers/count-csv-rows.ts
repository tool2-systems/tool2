import type { Tool } from "@/tools/loadTools"
import type { ToolHandler } from "./types"

export const countCsvRows: ToolHandler = {
  slug: "count-csv-rows",
  async preview({ tool, file }) {
    const raw = ""
    const result = {
      runId: crypto.randomUUID(),
      inputExt: "",
      previewMeta: {
        totalRows: 0,
        uniqueRows: 0,
        duplicates: 0
      }
    }
    return { raw, result }
  },
  async process({ tool, runId, run }) {
    throw new Error("not implemented")
  }
}
