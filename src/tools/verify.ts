import { listTools } from "./index"
import { getHandler } from "./handlers"

export function verifyToolsHaveHandlers() {
  const tools = listTools()
  const missing: string[] = []

  for (const t of tools) {
    const h = getHandler(t.slug)
    if (!h) missing.push(t.slug)
  }

  if (missing.length) {
    throw new Error(`Missing handlers for tool slugs: ${missing.join(", ")}`)
  }
}
