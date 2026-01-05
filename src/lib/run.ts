export type RunStatus = "preview_ready" | "paid" | "ready"

export type Run = {
  id: string
  toolSlug: string
  status: RunStatus
  createdAt: number
  paidAt?: number
  expiresAt?: number
  inputMeta: { filename: string; size: number }
  previewMeta?: Record<string, number>
  outputPath: string
}
