import { loadTools, type Tool } from "@/tools/loadTools"

let cache: Tool[] | null = null

export function listTools() {
  if (!cache) cache = loadTools()
  return cache
}

export function getTool(slug: string) {
  const tools = listTools()
  return tools.find(t => t.slug === slug) ?? null
}

export type { Tool }
