export const copy = {
  fileTooLarge: (mb: number) => `File exceeds ${mb} MB.`,
  uploadTitle: "Upload file",
  uploadHint: "Drag & drop or browse",
  analyzing: "Analyzing…",
  preparing: "Preparing file…",
  startOver: "Start over",
  changeFile: "Change file",
  generatePreview: "Generate preview",
  payAndDownload: (usd: number) => `Pay $${usd} and download`,
  downloadCsv: "Download CSV",
  runAgain: "Run again",
  previewFailed: "Preview failed.",
  processingFailed: "Processing failed.",
  paymentFailed: "Payment failed.",
  previewRemoved: (n: number) => `${n} rows will be removed.`,
  previewRemain: (unique: number, total: number) => `${unique} rows will remain out of ${total}.`,
  availableUntil: (s: string) => `Available until ${s}`
}
