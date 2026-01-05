import { Tool } from "@/tools/loadTools"

export type PreviewResult = {
  runId: string
  inputExt: string
  previewMeta: Record<string, number>
}

export type ToolHandler = {
  slug: string
  preview: (args: { tool: Tool; file: File }) => Promise<{ raw: string; result: PreviewResult }>
  process: (args: { tool: Tool; runId: string; run: any }) => Promise<void>
}
