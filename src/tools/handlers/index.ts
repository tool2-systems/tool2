import type { ToolHandler } from "./types"
import { removeDuplicateCsv } from "./remove-duplicate-csv"

const handlers: ToolHandler[] = [removeDuplicateCsv]

export function getHandler(slug: string) {
  return handlers.find(h => h.slug === slug) ?? null
}
