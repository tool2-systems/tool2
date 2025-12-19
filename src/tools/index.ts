import { tool as removeDuplicateCsv } from "./remove-duplicate-csv/tool"

export const tools = [removeDuplicateCsv] as const

export function getTool(slug: string) {
  return tools.find(t => t.slug === slug) ?? null
}
