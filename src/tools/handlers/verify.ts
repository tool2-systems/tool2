import { listTools } from "@/tools"
import type { ToolHandler } from "./types"
import { handlers } from "./registry"

export function verifyHandlersExistInTools() {
  const toolSlugs = new Set(listTools().map(t => t.slug))
  const extra: string[] = []

  for (const h of handlers as ToolHandler[]) {
    if (!toolSlugs.has(h.slug)) extra.push(h.slug)
  }

  if (extra.length) {
    throw new Error(`Handlers without matching tool slug: ${extra.join(", ")}`)
  }
}
