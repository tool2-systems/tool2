import type { ToolHandler } from "./types"
import { handlers } from "./registry"
import { verifyHandlersExistInTools } from "./verify"

let verified = false

function ensureVerified() {
  if (verified) return
  verifyHandlersExistInTools()
  verified = true
}

export function getHandler(slug: string) {
  ensureVerified()
  return handlers.find(h => h.slug === slug) ?? null
}

export type { ToolHandler }
